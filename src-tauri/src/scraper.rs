use lazy_static::lazy_static;
use regex::Regex;
use reqwest::blocking::get;
use reqwest::blocking::Client;
use reqwest::cookie::Jar;
use reqwest::Url;
use scraper::{Html, Selector};
use select::document::Document;
use select::predicate::Name;
use serde::Deserialize;
use serde::Serialize;
use serde_json::json;
use std::collections::HashMap;
use std::error::Error;
use std::sync::{Arc, Mutex};

struct ClientManager {
    client: Arc<Mutex<Option<Client>>>,
}

impl ClientManager {
    fn new() -> Self {
        ClientManager {
            client: Arc::new(Mutex::new(None)),
        }
    }

    fn set_client(&self, client: Client) {
        let mut client_guard = self.client.lock().unwrap();
        *client_guard = Some(client);
    }

    fn get_client(&self) -> Option<Client> {
        let client_guard = self.client.lock().unwrap();
        client_guard.clone()
    }
}

lazy_static! {
    static ref CLIENT_MANAGER: ClientManager = ClientManager::new();
}

#[derive(Serialize, Deserialize)]
struct ClassDetails {
    // TODO: add Status field
    status: String,
    class_name: String,
    teacher: String,
    room: String,
    description: String, // "Øvright indhold" in lectio
    time: String,
    day: String,
    homework: String,
    resources: String,
    notes: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct AbsenceData {
    team: String,
    opgjort: AbsenceDetail,
    for_the_year: AbsenceDetail,
    writing: Option<WritingDetail>,
}

#[derive(Debug, Serialize, Deserialize)]
struct AbsenceDetail {
    procent: String,
    moduler: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct WritingDetail {
    opgjort: AbsenceDetail,
    for_the_year_wrting: AbsenceDetail,
}

#[derive(Debug, Serialize, Deserialize)]
struct Assignment {
    week: String,
    team: String,
    title: String,
    deadline: String,
    student_time: String,
    status: String,
    absence_percent: String,
    follow_up: String,
    assignment_note: String,
    grade: String,
    student_note: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct Message {
    topic: String,
    sender: String,
    date: String,
    time: String,
    receivers: String,
    message: String,
}

#[tauri::command]
pub fn get_schools() -> HashMap<String, String> {
    // Make a GET request to the iframe's source URL
    let iframe_response = get("https://www.lectio.dk/lectio/login_list.aspx")
        .expect("Failed to send request to iframe source");

    // Read the iframe response body as a string
    let iframe_body = iframe_response
        .text()
        .expect("Failed to read iframe response body");

    // Parse the HTML document from the iframe
    let iframe_document = Document::from(iframe_body.as_str());

    let schools: HashMap<String, String> = iframe_document
        .find(Name("div"))
        .flat_map(|n| n.find(Name("a")))
        .filter_map(|n| {
            let school_id = n.attr("href")?.split('/').nth(2)?.to_string();
            let school_name = n.text();
            Some((school_id, school_name))
        })
        .collect();

    schools
}

#[tauri::command]
pub fn login(school_id: &str, username: &str, password: &str) -> String {
    match attempt_login(school_id, username, password) {
        Ok(client) => {
            CLIENT_MANAGER.set_client(client);
            json!({
                "status": "success"
            })
            .to_string()
        }
        Err(e) => {
            json!({ "status": "error", "message": format!("Failed to log in: {}", e) }).to_string()
        }
    }
}

fn attempt_login(
    school_id: &str,
    username: &str,
    password: &str,
) -> Result<Client, Box<dyn Error>> {
    // Create a URL object from the login URL for cookie handling
    let login_url = format!("https://www.lectio.dk/lectio/{}/login.aspx", school_id);
    let url = Url::parse(&login_url)?;

    // Create a cookie jar to hold the cookies
    let jar = Arc::new(Jar::default());

    // Create a client with cookie store enabled, using the jar
    let client = Client::builder()
        .cookie_store(true)
        .cookie_provider(jar.clone())
        .build()?;

    // Fetch the login page and parse it for the __EVENTVALIDATION token
    let login_page = client.get(url.clone()).send()?.text()?;
    let document = Html::parse_document(&login_page);
    let token_selector = Selector::parse("input[name='__EVENTVALIDATION']").unwrap();
    let token = document
        .select(&token_selector)
        .next()
        .and_then(|n| n.value().attr("value"))
        .ok_or("Failed to find __EVENTVALIDATION token")?;

    // Prepare login payload
    let mut payload = HashMap::new();
    payload.insert("m$Content$username", username);
    payload.insert("m$Content$password", password);
    payload.insert("m$Content$passwordHidden", password);
    payload.insert("__EVENTVALIDATION", token);
    payload.insert("__EVENTTARGET", "m$Content$submitbtn2");
    payload.insert("__EVENTARGUMENT", "");
    payload.insert("masterfootervalue", "X1!ÆØÅ");
    payload.insert("LectioPostbackId", "");

    // Attempt to log in
    client.post(url).form(&payload).send()?;

    // Return the client for further use with the maintained session
    Ok(client)
}

fn scrape_dashboard(school_id: &str) -> Result<String, Box<dyn Error>> {
    let client_opt = CLIENT_MANAGER.get_client();
    if let Some(client) = client_opt {
        let dashboard_url = format!("https://www.lectio.dk/lectio/{}/forside.aspx", school_id);
        let resp = client.get(&dashboard_url).send()?;
        let document = Html::parse_document(&resp.text()?);

        let selector = Selector::parse("div#s_m_Content_Content_aktueltIsland_pa").unwrap();

        let mut scraped_info = String::new();

        if let Some(element) = document.select(&selector).next() {
            for tr in element.select(&Selector::parse("tr").unwrap()) {
                // Extracting text from each row
                let text = tr.text().collect::<Vec<_>>().join(" ");
                scraped_info.push_str(&format!("{}\n", text.trim()));
            }
        } else {
            return Err("Section not found".into());
        }

        Ok(scraped_info)
    } else {
        Err("Client is not initialized. Please login first.".into())
    }
}

#[tauri::command]
pub fn get_dashboard(school_id: &str) -> String {
    match scrape_dashboard(&school_id) {
        Ok(dashboard) => dashboard,
        Err(e) => format!("Error: {}", e),
    }
}

fn scrape_schedule(school_id: &str) -> Result<String, Box<dyn Error>> {
    let client_opt = CLIENT_MANAGER.get_client();

    if let Some(client) = client_opt {
        let schedule_url = format!("https://www.lectio.dk/lectio/{}/SkemaNy.aspx", school_id);
        let resp = client.get(&schedule_url).send()?;
        let document = Html::parse_document(&resp.text()?);

        let class_selector = Selector::parse("div.s2skemabrikcontainer a.s2skemabrik").unwrap();

        let status_regex = Regex::new(r"(Ændret!|Aflyst!)").unwrap();
        let time_regex = Regex::new(r"(\d{2}:\d{2}) til (\d{2}:\d{2})").unwrap();
        let room_regex = Regex::new(r"Lokale(?:r)?: ([^\n]+)").unwrap();
        let day_regex = Regex::new(r"^\s*(ma|ti|on|to|fr)").unwrap();
        let description_regex = Regex::new(r"Øvrigt indhold:(.+?)(?:Note:|$)").unwrap();
        let ressource_regex = Regex::new(r"Resource: (.+)").unwrap();
        let teacher_regex = Regex::new(r"Lærer: ([^\n]+)").unwrap();
        let note_regex = Regex::new(r"Note:(.+)").unwrap();

        let mut classes = Vec::new();

        for class_div in document.select(&class_selector) {
            let tooltip = class_div.value().attr("data-tooltip").unwrap_or_default();
            let detail_link = class_div.value().attr("href");

            // Basic details from the tooltip
            let status = status_regex
                .captures(tooltip)
                .map_or("normal".to_string(), |caps| caps[0].to_string());
            let class_name = class_div
                .select(&Selector::parse("span[data-lectiocontextcard]").unwrap())
                .next()
                .map_or_else(|| "".to_string(), |n| n.inner_html().trim().to_string());
            let time = time_regex.captures(tooltip).map_or_else(
                || "Time not found".to_string(),
                |caps| format!("{} - {}", &caps[1], &caps[2]),
            );

            let mut day = "Day not found".to_string();
            let mut detailed_homework = String::new();
            let description = description_regex
                .captures(tooltip)
                .and_then(|caps| caps.get(1))
                .map_or(String::new(), |m| m.as_str().trim().to_string());
            let ressource = ressource_regex
                .captures(tooltip)
                .map_or_else(|| "".to_string(), |caps| caps[1].trim().to_string());
            let teacher = teacher_regex.captures(tooltip).map_or_else(
                || "Teacher not found".to_string(),
                |caps| caps[1].to_string(),
            );
            let room = room_regex
                .captures(tooltip)
                .map_or_else(|| "Room not found".to_string(), |caps| caps[1].to_string());
            let notes = note_regex
                .captures(tooltip)
                .map_or_else(|| "".to_string(), |caps| caps[1].trim().to_string());

            if let Some(url) = detail_link {
                let full_url = format!("https://www.lectio.dk{}", url);
                println!("Fetching detailed page: {}", full_url);
                let detail_response = client.get(full_url).send()?;
                if detail_response.status().is_success() {
                    let detail_document = Html::parse_document(&detail_response.text()?);
                    let homework_selector =
                        Selector::parse("div#s_m_Content_Content_tocAndToolbar_inlineHomeworkDiv")
                            .unwrap();
                    detailed_homework = detail_document
                        .select(&homework_selector)
                        .next()
                        .map(|div| div.text().collect::<Vec<_>>().join(" "))
                        .unwrap_or_else(|| "No detailed homework provided".to_string());

                    // Extract day from the detail page
                    let day_info = detail_document
                        .select(&Selector::parse("div.s2skemabrikcontent").unwrap())
                        .next();
                    if let Some(element) = day_info {
                        day = day_regex
                            .find(&element.inner_html())
                            .map_or("Day not found".to_string(), |m| m.as_str().to_string());
                    }
                } else {
                    println!(
                        "Failed to fetch detailed page, status: {}",
                        detail_response.status()
                    );
                }
            }

            classes.push(ClassDetails {
                status,
                class_name,
                teacher,
                room,
                description,
                time,
                homework: detailed_homework,
                resources: ressource,
                notes,
                day,
            });
        }
        serde_json::to_string(&classes).map_err(Into::into)
    } else {
        Err("Client is not initialized. Please login first.".into())
    }
}

#[tauri::command]
pub fn get_schedule(school_id: &str) -> String {
    match scrape_schedule(&school_id) {
        Ok(schedule) => schedule,
        Err(e) => format!("Error: {}", e),
    }
}

// Function to scrape absence
fn scrape_absence(
    school_id: &str,
) -> Result<HashMap<String, AbsenceData>, Box<dyn std::error::Error>> {
    let client = CLIENT_MANAGER
        .get_client()
        .ok_or("Client not initialized")?;
    let url = format!(
        "https://www.lectio.dk/lectio/{}/subnav/fravaerelev.aspx",
        school_id
    );
    let res = client.get(&url).send()?;
    if res.status() != 200 {
        return Err("Failed to fetch absence data".into());
    }

    let body = res.text()?;
    let document = Html::parse_document(&body);
    let selector =
        Selector::parse("table#s_m_Content_Content_SFTabStudentAbsenceDataTable").unwrap();
    let table = document
        .select(&selector)
        .next()
        .ok_or("Absence table not found")?;

    let mut results = HashMap::new();
    for row in table.select(&Selector::parse("tr").unwrap()) {
        let columns: Vec<_> = row.select(&Selector::parse("td").unwrap()).collect();
        if columns.len() >= 9 {
            let team = columns[0].text().collect::<String>();
            results.insert(
                team.clone(),
                AbsenceData {
                    team,
                    opgjort: AbsenceDetail {
                        procent: columns[1].text().collect(),
                        moduler: columns[2].text().collect(),
                    },
                    for_the_year: AbsenceDetail {
                        procent: columns[3].text().collect(),
                        moduler: columns[4].text().collect(),
                    },
                    writing: Some(WritingDetail {
                        opgjort: AbsenceDetail {
                            procent: columns[5].text().collect(),
                            moduler: columns[6].text().collect(),
                        },
                        for_the_year_wrting: AbsenceDetail {
                            procent: columns[7].text().collect(),
                            moduler: columns[8].text().collect(),
                        },
                    }),
                },
            );
        }
    }

    Ok(results)
}

// Tauri command for getting absence
#[tauri::command]
pub fn get_absence(school_id: &str) -> String {
    match scrape_absence(school_id) {
        Ok(data) => serde_json::to_string(&data).unwrap(),
        Err(e) => format!("Error fetching absence data: {}", e),
    }
}

fn scrape_assignments(school_id: &str) -> Result<Vec<Assignment>, Box<dyn Error>> {
    let url = format!(
        "https://www.lectio.dk/lectio/{}/OpgaverElev.aspx",
        school_id
    );

    let client = CLIENT_MANAGER
        .get_client()
        .ok_or("Client not initialized")?;

    let response = client.get(&url).send()?;
    if response.status() != 200 {
        return Err("Failed to fetch assignments page".into());
    }

    let text = response.text()?;
    let document = Html::parse_document(&text);
    let selector = Selector::parse("tr").unwrap(); // Assuming all relevant rows are within <tr> tags directly

    let mut assignments = Vec::new();
    for element in document.select(&selector) {
        let columns: Vec<_> = element.select(&Selector::parse("td").unwrap()).collect();

        // Check if enough columns exist
        if columns.len() >= 11 {
            let week = columns[0]
                .text()
                .collect::<Vec<_>>()
                .join(" ")
                .trim()
                .to_string();
            let team = columns[1]
                .text()
                .collect::<Vec<_>>()
                .join(" ")
                .trim()
                .to_string();
            let title = columns[2]
                .text()
                .collect::<Vec<_>>()
                .join(" ")
                .trim()
                .to_string();
            let deadline = columns[3]
                .text()
                .collect::<Vec<_>>()
                .join(" ")
                .trim()
                .to_string();
            let student_time = columns[4]
                .text()
                .collect::<Vec<_>>()
                .join(" ")
                .trim()
                .to_string();
            let status = columns[5]
                .text()
                .collect::<Vec<_>>()
                .join(" ")
                .trim()
                .to_string();
            let absence_percent = columns[6]
                .text()
                .collect::<Vec<_>>()
                .join(" ")
                .trim()
                .to_string();
            let follow_up = columns[7]
                .text()
                .collect::<Vec<_>>()
                .join(" ")
                .trim()
                .to_string();
            let assignment_note = columns[8]
                .text()
                .collect::<Vec<_>>()
                .join(" ")
                .trim()
                .to_string();
            let grade = columns[9]
                .text()
                .collect::<Vec<_>>()
                .join(" ")
                .trim()
                .to_string();
            let student_note = columns[10]
                .text()
                .collect::<Vec<_>>()
                .join(" ")
                .trim()
                .to_string();

            assignments.push(Assignment {
                week,
                team,
                title,
                deadline,
                student_time,
                status,
                absence_percent,
                follow_up,
                assignment_note,
                grade,
                student_note,
            });
        }
    }

    Ok(assignments)
}

#[tauri::command]
pub fn get_assignments(school_id: &str) -> String {
    match scrape_assignments(school_id) {
        Ok(assignments) => serde_json::to_string(&assignments).unwrap(),
        Err(e) => format!("Error: {}", e),
    }
}

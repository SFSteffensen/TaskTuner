use chrono::NaiveTime;
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
use std::sync::Arc;

#[derive(Serialize, Deserialize)]
struct ClassDetails {
    class_name: String,
    teacher: String,
    room: String,
    description: String,
    time: String,
    homework: String,
    resources: String,
    additional_content: String,
    notes: String,
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
            let schoolId = n.attr("href")?.split('/').nth(2)?.to_string();
            let school_name = n.text();
            Some((schoolId, school_name))
        })
        .collect();

    schools
}

#[tauri::command]
pub fn login(school_id: &str, username: &str, password: &str) -> String {
    match attempt_login(school_id, username, password) {
        Ok(client) => {
            let dashboard_info = scrape_dashboard(&client, school_id);
            let schedule_info = scrape_schedule(&client, school_id); // Fetch the schedule

            // Handle the results
            match (dashboard_info, schedule_info) {
                (Ok(dashboard), Ok(schedule)) => {
                    // Serialize both dashboard and schedule as JSON
                    json!({
                        "status": "success",
                        "dashboard": dashboard,
                        "schedule": schedule // Include the schedule in the response
                    }).to_string()
                },
                (Err(e), _) => json!({ "status": "error", "message": format!("Failed to scrape the dashboard: {}", e) }).to_string(),
                (_, Err(e)) => json!({ "status": "error", "message": format!("Failed to scrape the schedule: {}", e) }).to_string(),
            }
        }
        Err(e) => {
            // Serialize the login error as JSON
            json!({ "status": "error", "message": format!("Failed to log in: {}", e) }).to_string()
        }
    }
}

fn attempt_login(schoolId: &str, username: &str, password: &str) -> Result<Client, Box<dyn Error>> {
    // Create a URL object from the login URL for cookie handling
    let login_url = format!("https://www.lectio.dk/lectio/{}/login.aspx", schoolId);
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

fn scrape_dashboard(client: &Client, school_id: &str) -> Result<String, Box<dyn Error>> {
    let dashboard_url = format!("https://www.lectio.dk/lectio/{}/forside.aspx", school_id);
    let resp = client.get(&dashboard_url).send()?.text()?;

    let document = Html::parse_document(&resp);
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
}

fn scrape_schedule(
    client: &reqwest::blocking::Client,
    school_id: &str,
) -> Result<String, Box<dyn Error>> {
    let schedule_url = format!("https://www.lectio.dk/lectio/{}/SkemaNy.aspx", school_id);
    let resp = client
        .get(&schedule_url)
        .send()
        .map_err(|e| format!("Failed to send request: {}", e))?
        .text()
        .map_err(|e| format!("Failed to get response text: {}", e))?;

    let document = Html::parse_document(&resp);
    let class_selector = Selector::parse(
        "#s_m_Content_Content_SkemaMedNavigation_skemaprintarea .s2skemabrik.s2normal",
    )
    .unwrap();

    // Regular expressions for extracting data
    let time_regex = Regex::new(r"(\d{2}:\d{2}) til (\d{2}:\d{2})").unwrap();
    let room_regex = Regex::new(r"Lokale(?:r)?: ([^\n]+)").unwrap();
    let teacher_regex = Regex::new(r"Lærer: ([^\n]+)").unwrap();
    let homework_regex = Regex::new(r"Lektier:\s*(.+?)(?:\nNote:|\n?$)").unwrap();
    let additional_content_regex = Regex::new(r"Øvrigt indhold:(.+?)(?:Note:|$)").unwrap();
    let note_regex = Regex::new(r"Note:(.+)").unwrap();

    let mut classes = Vec::new();

    for class_div in document.select(&class_selector) {
        let tooltip = class_div.value().attr("data-tooltip").unwrap_or_default();

        let class_name = class_div
            .select(&Selector::parse("span[data-lectiocontextcard]").unwrap())
            .next()
            .map_or_else(|| "".to_string(), |n| n.inner_html().trim().to_string());
        let time = time_regex.captures(tooltip).map_or_else(
            || "Time not found".to_string(),
            |caps| format!("{} - {}", &caps[1], &caps[2]),
        );
        let teacher = teacher_regex.captures(tooltip).map_or_else(
            || "Teacher not found".to_string(),
            |caps| caps[1].to_string(),
        );
        let room = room_regex
            .captures(tooltip)
            .map_or_else(|| "Room not found".to_string(), |caps| caps[1].to_string());
        let homework = homework_regex
            .captures(tooltip)
            .and_then(|caps| caps.get(1))
            .map_or_else(|| "".to_string(), |m| m.as_str().trim().to_string());
        let additional_content = additional_content_regex
            .captures(tooltip)
            .map_or_else(|| "".to_string(), |caps| caps[1].trim().to_string());
        let notes = note_regex
            .captures(tooltip)
            .map_or_else(|| "".to_string(), |caps| caps[1].trim().to_string());

        // Assuming 'description' comes from another part of your HTML parsing
        let description = ""; // Placeholder

        classes.push(ClassDetails {
            class_name,
            teacher,
            room,
            description: description.to_string(),
            time,
            homework,
            resources: String::new(), // Add logic for resources if applicable
            additional_content,
            notes,
        });
    }

    serde_json::to_string(&classes).map_err(Into::into)
}

fn remove_html_tags(input: &str) -> String {
    let re = Regex::new(r"(?is)<.*?>").unwrap();
    re.replace_all(input, "").into_owned()
}

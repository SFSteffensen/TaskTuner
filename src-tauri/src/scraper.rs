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
    time: String, // TODO: Use a proper date type probably one from chrono crate
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

fn scrape_schedule(client: &Client, school_id: &str) -> Result<String, Box<dyn Error>> {
    let schedule_url = format!("https://www.lectio.dk/lectio/{}/SkemaNy.aspx", school_id);
    let resp = client.get(&schedule_url).send()?.text()?;
    let document = Html::parse_document(&resp);

    let selector = Selector::parse(
        "#s_m_Content_Content_SkemaMedNavigation_skemaprintarea .s2skemabrik.s2normal",
    )
    .unwrap();

    let mut classes = Vec::new();

    for class_div in document.select(&selector) {
        let inner_content_selector =
            Selector::parse(".s2skemabrikInnerContainer .s2skemabrikcontent.s2normal").unwrap();
        if let Some(inner_content) = class_div.select(&inner_content_selector).next() {
            // Extract class details. You may need to adjust the parsing logic based on the actual HTML structure
            let details_text = inner_content.inner_html();
            let details_parts: Vec<&str> = details_text.split("•").collect();
            if details_parts.len() >= 3 {
                let class_name = details_parts[0].trim().to_string();
                let teacher = details_parts[1].trim().to_string();
                let room = details_parts[2].trim().to_string();

                let description = inner_content
                    .select(&Selector::parse("span[style='word-wrap:break-word;']").unwrap())
                    .next()
                    .map_or_else(|| "".to_string(), |n| n.text().collect());

                let time = "Placeholder for actual time parsing logic".to_string();

                classes.push(ClassDetails {
                    class_name,
                    teacher,
                    room,
                    description,
                    time,
                });
            }
        }
    }

    let classes_json = serde_json::to_string(&classes)?;

    Ok(classes_json)
}

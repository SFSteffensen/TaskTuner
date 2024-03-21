use reqwest::blocking::get;
use reqwest::blocking::Client;
use reqwest::cookie::Jar;
use reqwest::Url;
use scraper::{Html, Selector};
use select::document::Document;
use select::predicate::Name;
use std::collections::HashMap;
use std::error::Error;
use std::sync::Arc;

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
pub fn login(schoolId: &str, username: &str, password: &str) -> bool {
    match attempt_login(schoolId, username, password) {
        Ok(client) => {
            if let Err(e) = print_page_content(&client, schoolId) {
                eprintln!("Error printing page content: {}", e);
            }
            true
        }
        Err(e) => {
            eprintln!("Failed to log in: {}", e);
            false
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

fn print_page_content(client: &Client, school_id: &str) -> Result<(), Box<dyn Error>> {
    let dashboard_url = format!("https://www.lectio.dk/lectio/{}/forside.aspx", school_id);
    let response = client.get(&dashboard_url).send()?;

    // Check if the request was successful
    if response.status().is_success() {
        let page_content = response.text()?;
        println!("{}", page_content); // Print the entire page content
        Ok(())
    } else {
        // Handle error status codes
        Err(format!("Failed to fetch page. Status code: {}", response.status()).into())
    }
}

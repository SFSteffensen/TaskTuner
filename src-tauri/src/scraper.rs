use reqwest::blocking::get;
use select::document::Document;
use select::predicate::Name;
use std::collections::HashMap;

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

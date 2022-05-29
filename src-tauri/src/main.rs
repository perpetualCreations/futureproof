#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use std::fs;
use std::path::PathBuf;
use dirs::home_dir;
use md5;

fn main() {
  make_data_dir();
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![get_state_path, get_checksum_path, get_checksum])
    .run(tauri::generate_context!())
    .expect("Application failed to launch.");
}

fn get_data_dir() -> PathBuf {
  let mut home = PathBuf::from(home_dir().expect("Unable to retrieve user's home directory.\nApplication failed to launch."));
  home.push(String::from(".futureproof"));
  home
}

#[tauri::command]
fn get_state_path() -> String {
  println!("get_state_path was invoked.");
  let mut home = get_data_dir();
  home.push("state");
  home.set_extension("json");
  home.into_os_string().into_string().unwrap_or(String::from("$HOME/.futureproof/state.json"))
}

#[tauri::command]
fn get_checksum_path() -> String {
  println!("get_checksum_path was invoked.");
  let mut home = get_data_dir();
  home.push("checksum");
  home.into_os_string().into_string().unwrap_or(String::from("$HOME/.futureproof/checksum"))
}

#[tauri::command]
fn get_checksum() -> String {
  println!("get_checksum was invoked.");
  let target = get_state_path();
  if fs::metadata(&target).is_ok() {
    return format!("{:x}", md5::compute(fs::read(target).expect("Unable to read data on disk for MD5 checksum calculation.")));
  }
  String::from("") // default.
}

fn make_data_dir() {
  let home = get_data_dir();
  if fs::metadata(&home).is_err() {
    fs::create_dir(&home).expect("Unable to create application directory in user's home directory.\nApplication failed to launch.");
  }
  let state = get_state_path();
  let checksum = get_checksum_path();
  if fs::metadata(&state).is_ok() && fs::metadata(&checksum).is_err() {
    fs::write(&checksum, get_checksum()).expect("Unable to create missing checksum for data on disk.\nApplication failed to launch.");
  }
}

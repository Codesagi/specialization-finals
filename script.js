'use strict';

const regionInput = document.getElementById('region');
const provinceInput = document.getElementById('province');
const cityInput = document.getElementById('city');
const barangayInput = document.getElementById('barangay');

const regionList = document.getElementById('regionList');
const provinceList = document.getElementById('provinceList');
const cityList = document.getElementById('cityList');
const barangayList = document.getElementById('barangayList');

const form = document.getElementById('registrationForm');
const userList = document.getElementById('userList');

// Loaded JSON data
let regions = [];
let provinces = [];
let cities = [];
let barangays = [];

// Load JSON files
async function loadJSON(file) {
  const res = await fetch(file);
  if (!res.ok) throw new Error(`Failed to load ${file}`);
  return await res.json();
}

// Initialize location data
async function initLocationData() {
  try {
    regions = await loadJSON('region.json');
    provinces = await loadJSON('province.json');
    cities = await loadJSON('city.json');
    barangays = await loadJSON('barangay.json');

    populateRegions();
  } catch (err) {
    console.error(err);
    alert('Error loading location data.');
  }
}

// Populate region datalist
function populateRegions() {
  regionList.innerHTML = '';
  regions.forEach(r => {
    const option = document.createElement('option');
    option.value = r.region_name;
    option.dataset.code = r.region_code;
    regionList.appendChild(option);
  });
}

// Populate provinces based on selected region
function populateProvinces(regionName) {
  provinceList.innerHTML = '';
  cityList.innerHTML = '';
  barangayList.innerHTML = '';
  provinceInput.value = '';
  cityInput.value = '';
  barangayInput.value = '';

  const selectedRegion = regions.find(r => r.region_name === regionName);
  if (!selectedRegion) return;

  const filteredProvinces = provinces.filter(p => p.region_code === selectedRegion.region_code);
  filteredProvinces.forEach(p => {
    const option = document.createElement('option');
    option.value = p.province_name;
    option.dataset.code = p.province_code;
    provinceList.appendChild(option);
  });
}

// Populate cities based on selected province
function populateCities(provinceName) {
  cityList.innerHTML = '';
  barangayList.innerHTML = '';
  cityInput.value = '';
  barangayInput.value = '';

  const selectedProvince = provinces.find(p => p.province_name === provinceName);
  if (!selectedProvince) return;

  const filteredCities = cities.filter(c => c.province_code === selectedProvince.province_code);
  filteredCities.forEach(c => {
    const option = document.createElement('option');
    option.value = c.city_name;
    option.dataset.code = c.city_code;
    cityList.appendChild(option);
  });
}

// Populate barangays based on selected city
function populateBarangays(cityName) {
  barangayList.innerHTML = '';
  barangayInput.value = '';

  const selectedCity = cities.find(c => c.city_name === cityName);
  if (!selectedCity) return;

  const filteredBarangays = barangays.filter(b => b.city_code === selectedCity.city_code);
  filteredBarangays.forEach(b => {
    const option = document.createElement('option');
    option.value = b.brgy_name;
    option.dataset.code = b.brgy_code;
    barangayList.appendChild(option);
  });
}

// Event listeners for cascading selections
regionInput.addEventListener('input', () => populateProvinces(regionInput.value));
provinceInput.addEventListener('input', () => populateCities(provinceInput.value));
cityInput.addEventListener('input', () => populateBarangays(cityInput.value));

// Form submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const region = regionInput.value;
  const province = provinceInput.value;
  const city = cityInput.value;
  const barangay = barangayInput.value;

  // Validate selections
  if (!regions.some(r => r.region_name === region)) { alert('Invalid region'); return; }
  if (!provinces.some(p => p.province_name === province)) { alert('Invalid province'); return; }
  if (!cities.some(c => c.city_name === city)) { alert('Invalid city'); return; }
  if (!barangays.some(b => b.brgy_name === barangay)) { alert('Invalid barangay'); return; }

  const email = document.getElementById('email').value.trim();
  const contact = document.getElementById('contact').value.trim();

  // Check for duplicate email or contact
  const { data: existingUsers, error: fetchError } = await supabase
    .from('users')
    .select('email, contact')
    .or(`email.eq.${email},contact.eq.${contact}`);

  if (fetchError) {
    console.error(fetchError);
    alert("Error checking for duplicates: " + fetchError.message);
    return;
  }

  if (existingUsers.length > 0) {
    const duplicateEmail = existingUsers.some(u => u.email === email);
    const duplicateContact = existingUsers.some(u => u.contact === contact);
    let msg = "This ";

    if (duplicateEmail && duplicateContact) msg += "email and contact number";
    else if (duplicateEmail) msg += "email";
    else msg += "contact number";

    alert(`${msg} is already registered! Please use a different one.`);
    return;
  }

  const user = {
  name: document.getElementById('name').value,
  course: document.getElementById('course').value,
  year: document.getElementById('year').value,
  gender: document.getElementById('gender').value,
  region, province, city, barangay,
  country: 'Philippines',
  email, contact,
  password: document.getElementById('password').value
};


  // Insert into Supabase
  const { data, error } = await supabase
    .from('users')
    .insert([user]);

  if (error) {
    console.error(error);
    alert("Error saving user: " + error.message);
    return;
  }

  alert("User registered successfully ✅");

  localStorage.setItem('loggedInUser', JSON.stringify(user));

  setTimeout(() => {
      window.location.href = 'login.html';
  }, 1500);

  displayUsers();
  form.reset();

  provinceList.innerHTML = '';
  cityList.innerHTML = '';
  barangayList.innerHTML = '';
});


// Display registered users
async function displayUsers() {
  const { data: users, error } = await supabase
    .from('users')
    .select('*');

  if (error) {
    console.error(error);
    userList.innerHTML = '<p style="text-align:center;color:red;">Error loading users</p>';
    return;
  }

  if (!users || users.length === 0) {
    userList.innerHTML = '<p style="text-align:center;color:#999;">No registered users yet</p>';
    return;
  }

  userList.innerHTML = users.map(u => `
    <div class="user-card">
      <strong>${u.name}</strong> (${u.gender})<br>
      ${u.course} - Year ${u.year}<br>
      ${u.barangay}, ${u.city}, ${u.province}<br>
      ${u.region}, ${u.country}<br>
      Email: ${u.email}, Contact: ${u.contact}
    </div>
  `).join('');
}


// Password strength checker
const passwordInput = document.getElementById('password');
const passwordMsg = document.getElementById('passwordMsg');

passwordInput.addEventListener('input', () => {
  const value = passwordInput.value;
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

  if (value.length === 0) {
    passwordMsg.textContent = '';
  } else if (!strongRegex.test(value)) {
    passwordMsg.textContent = "Password must have 8+ chars, uppercase, lowercase, number, special char.";
    passwordMsg.classList.remove('valid');
  } else {
    passwordMsg.textContent = "Strong password ✅";
    passwordMsg.classList.add('valid');
  }
});

// Email validation
const emailInput = document.getElementById('email');
const emailMsg = document.getElementById('emailMsg');

emailInput.addEventListener('input', () => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailInput.value.length === 0) {
    emailMsg.textContent = '';
  } else if (!emailPattern.test(emailInput.value)) {
    emailMsg.textContent = "Invalid email format (must contain @ and domain)";
    emailMsg.classList.remove('valid');
  } else {
    emailMsg.textContent = "Valid email ✅";
    emailMsg.classList.add('valid');
  }
});

// Contact number validation (11 digits only)
const contactInput = document.getElementById('contact');
const contactMsg = document.getElementById('contactMsg');

contactInput.addEventListener('input', () => {
  const contactPattern = /^[0-9]{11}$/;
  if (contactInput.value.length === 0) {
    contactMsg.textContent = '';
  } else if (!contactPattern.test(contactInput.value)) {
    contactMsg.textContent = "Contact number must be exactly 11 digits.";
    contactMsg.classList.remove('valid');
  } else {
    contactMsg.textContent = "Valid contact number ✅";
    contactMsg.classList.add('valid');
  }
});

const togglePassword = document.getElementById('togglePassword');

togglePassword.addEventListener('click', () => {
  const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
  passwordInput.setAttribute('type', type);

  // Change button icon
  togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
});

// Initialize location data
initLocationData();
displayUsers();
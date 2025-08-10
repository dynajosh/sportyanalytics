const axios = require('axios');
const dotenv = require('dotenv');
const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

dotenv.config();
app.use(cors({
//   origin: 'http://localhost:5173',
origin: ['http://localhost:5173', 'https://antisporty.netlify.app/'],

  credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API is running');
});

// app.post('/login', async (req, res) => {
//   const { username, password } = req.body;
//   if (!username || !password) {
//     return res.status(400).json({ error: 'Username and password are required.' });
//   }

//   try {
//     // const browser = await puppeteer.launch({
//     //   headless: false, // change to true in production
//     //   args: ['--start-maximized']
//     // });

//     const browser = await puppeteer.launch({
//         headless: true,
//         args: [
//             '--no-sandbox',
//             '--disable-setuid-sandbox'
//         ]
//         });

//     const page = await browser.newPage();

//     // Go to login page
//     await page.goto('https://www.sportybet.com/ng/login', { waitUntil: 'networkidle2' });

//     // Enter credentials
//     await page.type('[placeholder="Mobile Number"]', username);
//     await page.type('[placeholder="Password"]', password);

//     // Click login
//     await page.click('.af-button--primary');

//     // Wait for balance wrapper to appear — indicates successful login
//     await page.waitForSelector('.m-bablance-wrapper', { timeout: 15000 });

//     // Grab cookies
//     const allCookies = await page.cookies();

//     // Find accessToken in cookies
//     const tokenCookie = allCookies.find(c => c.name === 'accessToken');
//     let accessToken = null;
//     if (tokenCookie) {
//       accessToken = decodeURIComponent(tokenCookie.value);
//       console.log("Access Token Found:", accessToken);
//     }

//     await browser.close();

//     if (!accessToken) {
//       return res.status(500).json({ error: 'Access token not found.' });
//     }

//     return res.status(200).json({ accessToken });

//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).json({ error: 'An error occurred while processing the login.' });
//   }
// });

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    console.log('Attempting to launch browser...');
    
    // const browser = await puppeteer.launch({
    //   headless: true,
    //   args: [
    //     '--no-sandbox',
    //     '--disable-setuid-sandbox',
    //     '--disable-dev-shm-usage',
    //     '--disable-accelerated-2d-canvas',
    //     '--no-first-run',
    //     '--no-zygote',
    //     '--single-process',
    //     '--disable-gpu',
    //     '--disable-background-timer-throttling',
    //     '--disable-backgrounding-occluded-windows',
    //     '--disable-renderer-backgrounding'
    //   ]
    // });

    const browser = await puppeteer.launch({
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });

    console.log('Browser launched successfully');

    const page = await browser.newPage();

    // Go to login page
    await page.goto('https://www.sportybet.com/ng/login', { waitUntil: 'networkidle2' });

    // Enter credentials
    await page.type('[placeholder="Mobile Number"]', username);
    await page.type('[placeholder="Password"]', password);

    // Click login
    await page.click('.af-button--primary');

    // Wait for balance wrapper to appear — indicates successful login
    await page.waitForSelector('.m-bablance-wrapper', { timeout: 15000 });

    // Grab cookies
    const allCookies = await page.cookies();

    // Find accessToken in cookies
    const tokenCookie = allCookies.find(c => c.name === 'accessToken');
    let accessToken = null;
    if (tokenCookie) {
      accessToken = decodeURIComponent(tokenCookie.value);
      console.log("Access Token Found:", accessToken);
    }

    await browser.close();

    if (!accessToken) {
      return res.status(500).json({ error: 'Access token not found.' });
    }

    return res.status(200).json({ accessToken });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while processing the login.' });
  }
});

app.get('/history', async (req, res) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header with Bearer token required.' });
  }

  const accessToken = authHeader.replace('Bearer ', '').trim();
  console.log("Access Token received from Bearer:", accessToken);

  console.log("this is the access token", accessToken);

  try {
    const url = 'https://www.sportybet.com/api/ng/orders/order/v2/realbetlist?isSettled=10&pageSize=300&pageNo=1';
    const response = await axios.get(url, {
      headers: {
        'cookie': 'accessToken=' + accessToken,
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
      },
    });

    return res.status(200).json(response.data?.data?.entityList);

  } catch (error) {
    if (error.response) {
      console.error('Error fetching history:', error.response.status);
      return res.status(error.response.status).json({
        error: 'Failed to fetch history',
        details: error.response.data
      });
    } else {
      console.error('Error fetching history:', error.message);
      return res.status(500).json({ error: 'Failed to fetch history', details: error.message });
    }
  }
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

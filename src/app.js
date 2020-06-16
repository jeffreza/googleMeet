const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");

app.use(express.static(path.join(__dirname, "public")));
app.set("views", __dirname + "/public/views");
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let var_arr = [
  "Extracting finished. Refresh the browser to see your Google events",
];

app.get("/", (req, res) => {
  res.render("index.html");
});

app.post("/", (req, res) => {
  const tkn = req.body.token;
  //console.log(tkn);
  const fs = require("fs");
  const readline = require("readline");
  const { google } = require("googleapis");

  // If modifying these scopes, delete token.json.
  const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];
  // The file token.json stores the user's access and refresh tokens, and is
  // created automatically when the authorization flow completes for the first
  // time.
  const TOKEN_PATH = "token.json";

  // Load client secrets from a local file.
  fs.readFile("credentials.json", (err, content) => {
    if (err) return console.log("Error loading client secret file:", err);
    // Authorize a client with credentials, then call the Google Calendar API.
    authorize(JSON.parse(content), listEvents);
  });

  /**
   * Create an OAuth2 client with the given credentials, and then execute the
   * given callback function.
   * @param {Object} credentials The authorization client credentials.
   * @param {function} callback The callback to call with the authorized client.
   */
  function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) return getAccessToken(oAuth2Client, callback);
      oAuth2Client.setCredentials(JSON.parse(token));
      callback(oAuth2Client);
    });
  }

  /**
   * Get and store new token after prompting for user authorization, and then
   * execute the given callback with the authorized OAuth2 client.
   * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
   * @param {getEventsCallback} callback The callback for the authorized client.
   */
  function getAccessToken(oAuth2Client, callback) {
    oAuth2Client.getToken(tkn, (err, token) => {
      if (err) return console.error("Error retrieving access token", err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log("Token stored to", TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  }

  /**
   * Lists the next 10 events on the user's primary calendar.
   * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
   */
  function listEvents(auth) {
    async function fun() {
      const calendar = await google.calendar({ version: "v3", auth });
      calendar.events.list(
        {
          calendarId: "primary",
          timeMin: new Date().toISOString(),
          maxResults: 10,
          singleEvents: true,
          orderBy: "startTime",
        },
        (err, res) => {
          if (err) return console.log("The API returned an error: " + err);
          const events = res.data.items;
          if (events.length) {
            console.log("Upcoming 10 events:", events);
            events.map((event, i) => {
              var_arr.push(event);
            });
          } else {
            console.log("No upcoming events found.");
          }
        }
      );
    }

    fun();
  }
  res.send(var_arr);
  res.render("index.html");
});

app.post("/events", (req, res) => {
  const { google } = require("googleapis");
  // Require oAuth2 from our google instance.
  const { OAuth2 } = google.auth;
  const oAuth2Client = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET
  );

  // Call the setCredentials method on our oAuth2Client instance and set our refresh token.
  oAuth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN,
  });

  // Create a new calender instance.
  const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

  // Create a new event start date instance for temp uses in our calendar.
  const eventStartTime = new Date();
  eventStartTime.setDate(eventStartTime.getDay() + 2);

  // Create a new event end date instance for temp uses in our calendar.
  const eventEndTime = new Date();
  eventEndTime.setDate(eventEndTime.getDay() + 2);
  eventEndTime.setMinutes(eventEndTime.getMinutes() + 60);
  // Create a dummy event for temp uses in our calendar
  const event = {
    summary: `${req.body.summary}`,
    description: `${req.body.description}`,
    colorId: 6,
    conferenceData: {
      createRequest: { requestId: "7qxalsvy0s" },
      conferenceDataVersion: 1,
      entryPoints: [
        {
          entryPointType: "video",
          uri: "meet.google.com/wix-pvpt-njj",
          label: "meet.google.com/wix-pvpt-njj",
        },
        {
          entryPointType: "phone",
          uri: "+44-20-3873-7652",
          label: "+44-20-3873-7652",
          pin: "6054226",
        },
      ],
      conferenceSolution: {
        key: {
          type: "hangoutsMeet",
        },
        name: "Hangouts Meet",
        ziconUri:
          "https://lh5.googleusercontent.com/proxy/bWvYBOb7O03a7HK5iKNEAPoUNPEXH1CHZjuOkiqxHx8OtyVn9sZ6Ktl8hfqBNQUUbCDg6T2unnsHx7RSkCyhrKgHcdoosAW8POQJm_ZEvZU9ZfAE7mZIBGr_tDlF8Z_rSzXcjTffVXg3M46v",
      },
      conferenceId: "wix-pvpt-njj",
      signature: "ADwwud9tLfjGQPpT7bdP8f3bq3DS",
    },
    start: {
      dateTime: eventStartTime,
    },
    end: {
      dateTime: eventEndTime,
    },
  };

  // Check if we a busy and have an event on our calendar for the same time.
  calendar.freebusy.query(
    {
      resource: {
        timeMin: eventStartTime,
        timeMax: eventEndTime,
        items: [{ id: "primary" }],
      },
    },
    (err, res) => {
      // Check for errors in our query and log them if they exist.
      if (err) return console.error("Free Busy Query Error: ", err);

      // Create an array of all events on our calendar during that time.
      const eventArr = res.data.calendars.primary.busy;

      // Check if event array is empty which means we are not busy
      if (eventArr.length === 0) {
        // If we are not busy create a new calendar event.
        return calendar.events.insert(
          { calendarId: "primary", resource: event },
          (err) => {
            // Check for errors and log them if they exist.
            if (err)
              return console.error("Error Creating Calender Event:", err);
            // Else log that the event was created.
            return console.log("Event created successfully.");
          }
        );
      }
      // If event array is not empty log that we are busy.
      return console.log(`Sorry I'm busy for that time...`);
    }
  );

  console.log(req.body);

  // using Twilio SendGrid's v3 Node.js Library
  // https://github.com/sendgrid/sendgrid-nodejs
  const sgMail = require("@sendgrid/mail");
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to: req.body.to,
    from: "meetapp3@gmail.com",
    subject: req.body.summary,
    text: req.body.description,
    html: req.body.description,
  };

  sgMail
    .send(msg)
    .then(() => {
      console.log("Message sent");
    })
    .catch((error) => {
      console.log(error.response.body);
      // console.log(error.response.body.errors[0].message)
    });

  res.render("events.html");
});

app.listen(3000, (req, res) => {
  console.log("listening at port 3000");
});

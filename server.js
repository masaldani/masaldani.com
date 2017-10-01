if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const Path = require("path");
const Hapi = require("hapi");

const server = new Hapi.Server();

server.connection({
  port: process.env.PORT || 8000,
  routes: {
    files: {
      relativeTo: Path.join(__dirname, "packages")
    }
  }
});

server.register(require("inert"), err => {
  if (err) {
    throw err;
  }

  server.route({
    method: "GET",
    path: "/{param*}",
    handler: {
      directory: {
        path: "app"
      }
    }
  });

  server.route({
    method: "GET",
    path: "/",
    handler(request, reply) {
      reply.file("app/index.html");
    }
  });
});

server.route({
  method: ["POST"],
  path: "/api/contact",
  handler(request, reply) {
    const { name, email, phone, message } = request.payload;
    const { MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_RECIPIENTS } = process.env;

    const mailgun = require("mailgun-js")({
      apiKey: MAILGUN_API_KEY,
      domain: MAILGUN_DOMAIN
    });

    const data = {
      from: email,
      to: MAILGUN_RECIPIENTS,
      subject: `Masaldani enquiry from ${name} ${phone}`,
      text: `${message || ""}`
    };

    if (email || phone) {
      mailgun.messages().send(data, (error, body) => {
        console.log(body);
        console.log(data);
      });
    }

    return reply("Email sent!");
  }
});

// Start the server
server.start(err => {
  if (err) {
    throw err;
  }
  console.log(`Server running at: ${server.info.uri}`);
});

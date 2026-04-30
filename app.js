require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname)));

app.post("/api/generate-leads", async (req, res) => {
  const niche = sanitizeInput(req.body.niche);
  const location = sanitizeInput(req.body.location);

  if (!niche || !location) {
    return res.status(400).json({ error: "Please provide both niche and location." });
  }

  const baseLeads = createSampleLeads(niche, location);

  if (!OPENAI_API_KEY) {
    return res.json({
      usedAI: false,
      leads: addMockCopy(baseLeads, niche, location),
    });
  }

  try {
    const aiCopy = await generateOutreachCopy(baseLeads, niche, location);
    const leads = baseLeads.map((lead, index) => ({
      ...lead,
      message: aiCopy[index]?.message || fallbackMessage(lead, niche, location),
      salesPitch: aiCopy[index]?.salesPitch || fallbackPitch(lead, niche),
    }));

    return res.json({ usedAI: true, leads });
  } catch (error) {
    console.error("OpenAI generation failed:", error.message);
    return res.json({
      usedAI: false,
      leads: addMockCopy(baseLeads, niche, location),
      warning: "OpenAI request failed. Showing mock demo data.",
    });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`LeadGold AI running on http://localhost:${PORT}`);
  });
}

module.exports = app;

function sanitizeInput(value) {
  return String(value || "").trim().slice(0, 90);
}

function createSampleLeads(niche, location) {
  const cleanNiche = slugify(niche);
  const cleanLocation = slugify(location);
  const names = [
    `Aurum ${titleCase(niche)} Studio`,
    `${titleCase(location)} Prime Partners`,
    `Noble Growth ${titleCase(niche)}`,
    `Elite ${titleCase(niche)} Collective`,
    `${titleCase(location)} Signature Group`,
  ];

  return names.map((name, index) => {
    const domain = `${cleanNiche}-${cleanLocation}-${index + 1}.com`;
    return {
      name,
      email: `hello@${domain}`,
      website: domain,
    };
  });
}

async function generateOutreachCopy(leads, niche, location) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      instructions:
        "You write concise B2B outreach. Return only valid JSON that matches the requested schema.",
      input: `Create personalized outreach for these leads in ${location}. Niche: ${niche}. Leads: ${JSON.stringify(
        leads
      )}`,
      text: {
        format: {
          type: "json_schema",
          name: "lead_outreach",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              leads: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    message: {
                      type: "string",
                      description: "A warm 2 sentence personalized outreach email opener.",
                    },
                    salesPitch: {
                      type: "string",
                      description: "A direct 1 sentence sales pitch.",
                    },
                  },
                  required: ["message", "salesPitch"],
                },
              },
            },
            required: ["leads"],
          },
          strict: true,
        },
      },
      max_output_tokens: 900,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const outputText = extractOutputText(data);
  const parsed = JSON.parse(outputText);
  return parsed.leads;
}

function extractOutputText(response) {
  if (response.output_text) return response.output_text;

  const message = response.output?.find((item) => item.type === "message");
  const content = message?.content?.find((item) => item.type === "output_text");
  if (content?.text) return content.text;

  throw new Error("No text returned by OpenAI.");
}

function addMockCopy(leads, niche, location) {
  return leads.map((lead) => ({
    ...lead,
    message: fallbackMessage(lead, niche, location),
    salesPitch: fallbackPitch(lead, niche),
  }));
}

function fallbackMessage(lead, niche, location) {
  return `Hi ${lead.name}, I noticed your work in ${location}'s ${niche} market and thought there may be a strong fit. LeadGold AI can help you identify warmer prospects and start better conversations without adding manual research time.`;
}

function fallbackPitch(lead, niche) {
  return `We help ${niche} teams turn targeted lead lists into polished outreach campaigns ready to send.`;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32) || "lead";
}

function titleCase(value) {
  return String(value)
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

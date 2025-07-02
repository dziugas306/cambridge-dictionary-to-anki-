chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "addCard") {
    const { word, definition, deckName, examples, audio, picture } = request;

    const note = {
      deckName: deckName,
      modelName: "Basic",
      fields: {
        Front: `<bold>${word}</bold>`,
        Back: `<bold>${definition}</bold>
                <ul>
                ${examples
                  .map((example: string) => `<li>${example}</li>`)
                  .join("")}
                </ul>`,
      },
      options: { allowDuplicate: false },
      tags: [],
      audio: [
        {
          url: audio,
          filename: `${word}.mp3`,
          fields: ["Back"],
        },
      ],
      picture: picture
        ? [
            {
              url: picture,
              filename: `${word}.jpg`,
              fields: ["Back"],
            },
          ]
        : undefined,
    };

    fetch("http://localhost:8765", {
      method: "POST",
      body: JSON.stringify({
        action: "addNote",
        version: 6,
        params: { note },
      }),
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          sendResponse({ error: data.error });
        } else {
          sendResponse({ result: data.result });
        }
      })
      .catch((err) => sendResponse({ error: err.message }));

    return true;
  }
});

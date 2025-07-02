const getSelectedDeck = () => {
  return new Promise<string>((resolve) =>
    chrome.storage.local.get("selectedDeck", (result) => {
      resolve(result.selectedDeck ?? "");
    })
  );
};

const fetchAvailableDecks = async (): Promise<string[]> => {
  const result = await fetch("http://localhost:8765", {
    method: "POST",
    body: JSON.stringify({
      action: "deckNames",
      version: 6,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await result.json();

  if (data.error) {
    throw new Error(data.error);
  }

  const decks = data.result.filter((name: string) => !name.includes("::"));
  return decks;
};

const getDeckSelectElement = () => {
  const deckSelect = document.querySelector<HTMLSelectElement>("#deckSelect");

  if (!deckSelect) {
    throw new Error("Couldn't find element with id deckSelect");
  }

  return deckSelect;
};

const populateDeckSelect = (decks: string[], selectedDeck: string) => {
  const deckSelect = getDeckSelectElement();

  decks.forEach((deck) => {
    const option = document.createElement("option");
    option.value = deck;
    option.textContent = deck;
    option.selected = selectedDeck === deck;
    deckSelect.appendChild(option);
  });
};

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const deckSelect = getDeckSelectElement();

    const selectedDeck = await getSelectedDeck();
    const availableDecks = await fetchAvailableDecks();

    deckSelect.innerHTML = "";
    populateDeckSelect(availableDecks, selectedDeck);

    deckSelect.addEventListener("change", () => {
      const selectedDeck = getDeckSelectElement().value;
      chrome.storage.local.set({ selectedDeck });
    });
  } catch (error) {
    alert(error);
  }
});

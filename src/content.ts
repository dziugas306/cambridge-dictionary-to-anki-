interface Card {
  word?: string;
  definition?: string;
  examples?: string[];
  deckName?: string;
  audio?: string;
  picture?: string;
}

(() => {
  const getWord = () => {
    const url = window.location.href;
    const match = url.match(
      /https:\/\/dictionary\.cambridge\.org\/dictionary\/english\/([^/?#]+)/
    );

    if (match) {
      return match[1];
    }
  };

  const getSelectedDeck = async () => {
    const selectedDeck = await new Promise<string | undefined>(
      (resolve, reject) => {
        chrome.storage.local.get("selectedDeck", (result) => {
          resolve(result.selectedDeck);
        });
      }
    );

    if (!selectedDeck) {
      throw new Error("No deck selected");
    }

    return selectedDeck;
  };

  const getSelectedDeckOptional = async () => {
    try {
      const deck = await getSelectedDeck();
      return deck;
    } catch {
      return undefined;
    }
  };

  const getAudio = (node: HTMLElement) => {
    const parentNode =
      node.closest(".pr.entry-body__el") ?? node.closest(".pv-block");
    const [audio] = Array.from(
      parentNode!.querySelectorAll<HTMLAudioElement>("audio source")
    )
      .map((node) => node.src)
      .filter((src) => src.includes("us") && src.includes("mp3"));

    if (!audio) {
      throw new Error("Audio not found");
    }

    return audio;
  };

  const getPicture = (node: HTMLElement) => {
    const parentNode = node.closest(".sense-body.dsense_b");
    return parentNode?.querySelector("img")?.src;
  };

  function addCardToAnki({
    word,
    definition,
    examples,
    deckName,
    audio,
    picture,
  }: Card) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          action: "addCard",
          word,
          definition,
          examples,
          deckName,
          audio,
          picture,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            return reject(new Error(chrome.runtime.lastError.message));
          }

          if (response?.error) {
            return reject(new Error(response.error));
          }

          resolve(response.result);
        }
      );
    });
  }

  const handleClick = async (node: HTMLElement) => {
    try {
      const deckName = await getSelectedDeck();
      const audio = getAudio(node);
      const picture = getPicture(node);
      const word = getWord();
      const definition =
        node.querySelector(".def.ddef_d.db")?.textContent ?? undefined;

      const examples = Array.from(
        node.querySelectorAll<HTMLElement>(".examp.dexamp")
      )
        .map((node) => node.textContent?.trim() ?? "")
        .filter(Boolean);

      await addCardToAnki({
        word,
        definition,
        examples,
        deckName,
        audio,
        picture,
      });
    } catch (error) {
      alert(error);
    }
  };

  const replaceContent = async () => {
    const selectedDeck =
      (await getSelectedDeckOptional()) ?? "Deck not selected";
    const nodes = Array.from(document.querySelectorAll(".dwl.hax"));
    nodes.forEach((node) => {
      node.innerHTML = "";

      const parentNode = node.parentElement;

      if (!parentNode) {
        throw Error("No parent element");
      }

      const button = document.createElement("a");
      button.className = "dwla wordlist-add-button";
      button.addEventListener("click", () => handleClick(parentNode));

      const text = document.createElement("span");
      text.textContent = `Add to Anki [ ${selectedDeck} ]`;
      text.className = "tb fs10 hvm";

      button.appendChild(text);
      node.appendChild(button);
    });
  };

  const load = () => {
    const word = getWord();

    if (!word) {
      return;
    }

    replaceContent();
  };

  load();
})();

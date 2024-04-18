"use strict";

(function () {
  const CURRENCIES = ["USD", "GBP", "JPY", "EUR", "AUD", "CAD", "CHF", "NZD"];

  // Graph used in Bellman-Ford algorithm.
  let graph = getNewGraph();

  window.addEventListener("load", init);

  /**
   * Initialize user interface.
   */
  function init() {
    initCurrencyMenu("currency-menu-1");
    initCurrencyMenu("currency-menu-2");
    initCurrencyButton();
    initClearButtion();
  }

  /**
   * Initialize dropdown menu used to select currencies.
   * @param {string} menuId - The ID of the menu to be initialized.
   */
  function initCurrencyMenu(menuId) {
    let menu = document.getElementById(menuId);
    for (let i = 0; i < CURRENCIES.length; i++) {
      let currency = CURRENCIES[i];
      let currencyOption = document.createElement("option");
      currencyOption.value = i;
      currencyOption.textContent = currency;
      menu.appendChild(currencyOption);
    }
  }

  /**
   * Intialize button to add currency pairs.
   */
  function initCurrencyButton() {
    let button = document.getElementById("currency-button");
    button.addEventListener("click", addCurrencyPair);
  }

  /**
   * Initialize button to clear all currency pairs.
   */
  function initClearButtion() {
    let button = document.getElementById("clear-button");
    button.addEventListener("click", clearCurrencies);
  }

  /**
   * Add the currency pair and exchange rate currently selected.
   */
  function addCurrencyPair() {
    let menu1 = document.getElementById("currency-menu-1");
    let menu2 = document.getElementById("currency-menu-2");
    let exchangeInput = document.getElementById("exchange-input");

    let baseKey = parseInt(menu1.value);
    let quoteKey = parseInt(menu2.value);
    let rate = parseFloat(exchangeInput.value);
    let base = CURRENCIES[baseKey];
    let quote = CURRENCIES[quoteKey];

    if (baseKey === quoteKey) {
      displayMessage("Invalid currency pair.");
    } else if (isNaN(rate) || rate <= 0) {
      displayMessage("Invalid exchange rate.");
    } else {
      displayCurrencyPair(base, quote, rate);
      graph[baseKey][quoteKey] = -Math.log(rate);
      checkForArbitrage();
      displayMessage("");
    }
  }

  /**
   * Clear all currency pairs from the display and the underlying graph.
   */
  function clearCurrencies() {
    let exchangeDisplay = document.getElementById("exchange-display");
    exchangeDisplay.innerHTML = "";
    displayMessage("");
    graph = getNewGraph();
  }

  /**
   * Helper method to display or update a currency pair.
   * @param {string} base - First currency.
   * @param {string} quote - Second currency.
   * @param {float} rate - Exchange rate between the two currencies.
   */
  function displayCurrencyPair(base, quote, rate) {
    let display = document.getElementById("exchange-display");
    let pairId = getPairId(base, quote);
    let currencyPair = document.getElementById(pairId);

    if (!currencyPair) {
      currencyPair = document.createElement("p");
      currencyPair.id = pairId;
      currencyPair.classList.add("currency-pair");
      display.appendChild(currencyPair);
    }

    currencyPair.textContent = base + "/" + quote + " = " + rate;
  }

  /**
   * Helper function to display message.
   * @param {string} message - Message to be displayed.
   */
  function displayMessage(message) {
    let output = document.getElementById("message");
    output.textContent = message;
  }

  /**
   * Helper function to check for existing arbitrage among current currency pairs.
   */
  function checkForArbitrage() {
    let status = document.getElementById("status");
    let cycle = getArbitrageCycle();

    if (cycle.length > 0) {
      let text = "Arbitrage found! ";
      for (let key of cycle) {
        text += CURRENCIES[key] + " → ";
      }
      status.textContent = text.substring(0, text.length - 2);
      updateCurrencyPairs(cycle);
    } else {
      status.textContent = "No arbitrage found.";
      resetCurrencyPairs();
    }
  }

  /**
   * Update styles from currency pairs that form an arbitrage cycle.
   * @param {Array<number>} cycle - Contains keys of currencies that have an arbitrage.
   */
  function updateCurrencyPairs(cycle) {
    for (let i = 0; i < cycle.length - 1; i++) {
      let base = CURRENCIES[cycle[i]];
      let quote = CURRENCIES[cycle[i + 1]];
      let pairId = getPairId(base, quote);
      let currencyPair = document.getElementById(pairId);
      currencyPair.classList.add("arbitrage");
    }
  }

  /**
   * Remove styles from all currency pairs.
   */
  function resetCurrencyPairs() {
    let currencyPairs = document.querySelectorAll("#exchange-display p");
    for (let pair of currencyPairs) {
      pair.classList.remove("arbitrage");
    }
  }

  /**
   * Generate an ID for a currency pair.
   * @param {string} base First currency.
   * @param {string} quote Second currency.
   * @returns {string} ID of the currency pair.
   */
  function getPairId(base, quote) {
    return base + "-" + quote;
  }

  /**
   * Helper function to create an empty graph used in Bellman-Ford.
   * @returns {Array<Array<number>>} A new graph represented as a 2D array.
   */
  function getNewGraph() {
    let newGraph = [];
    for (let i = 0; i < CURRENCIES.length; i++) {
      newGraph.push(Array(CURRENCIES.length).fill(Infinity));
    }
    return newGraph;
  }

  /**
   * Check graph for an arbitrage cycle.
   * @returns {Array<number>} Contains cycle of currencies that have an arbitrage.
   */
  function getArbitrageCycle() {
    for (let source = 0; source < CURRENCIES.length; source++) {
      let cycle = bellmanFord(source);
      if (cycle.length > 0) {
        return cycle;
      }
    }
    return [];
  }

  /**
   * Bellman-Ford algorithm used to detect argitrages.
   * @param {number} source - Starting point to search from.
   * @returns {Array<number>} Array of currency keys that form an arbitrage cycle.
   */
  function bellmanFord(source) {
    const numVertices = graph.length;
    let distances = new Array(numVertices).fill(Infinity);
    let predecessor = new Array(numVertices).fill(-1);
    distances[source] = 0;

    // Relax all edges.
    for (let i = 0; i < numVertices; i++) {
      for (let from = 0; from < numVertices; from++) {
        for (let to = 0; to < numVertices; to++) {
          let weight = graph[from][to];
          let newDistance = distances[from] + weight;
          if (newDistance !== Infinity && newDistance < distances[to]) {
            distances[to] = newDistance;
            predecessor[to] = from;
          }
        }
      }
    }
    return getNegativeCycle(distances, predecessor);
  }

  /**
   * Helper function to retrieve negative-weight cycles after running Bellman-Ford
   * @param {Array<number>} distances Where distances[i] is the distance from the source to i.
   * @param {Array<number>} predecessor Where predecessor i is the predecessor of node i.
   * @returns {Array<number>} Array of currency keys that form an arbitrage cycle.
   */
  function getNegativeCycle(distances, predecessor) {
    let numVertices = graph.length;

    for (let from = 0; from < numVertices; from++) {
      for (let to = 0; to < numVertices; to++) {
        let weight = graph[from][to];
        let newDistance = distances[from] + weight;

        // Negative cycle found.
        if (newDistance !== Infinity && newDistance < distances[to]) {
          let cycle = [];
          let visited = new Set();

          // Find the start of the cycle.
          while (!visited.has(to)) {
            visited.add(to);
            to = predecessor[to];
          }
          let cycleStart = to;

          // Add cycle to array.
          do {
            cycle.push(to);
            to = predecessor[to];
          } while (to !== cycleStart);
          cycle.push(to);
          cycle.reverse();
          return cycle;
        }
      }
    }
    return [];
  }
})();

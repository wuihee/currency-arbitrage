# Currency Arbitrage

Simple front-end currency arbitrage simulator using Bellman-Ford. I was unable to find a free API to fetch real-time currency data so I created a simulator. Each currency is a node in a weighted, directed graph, where the weights are the negative logrithms of the exchanges. This is so that when Bellman-Ford detects a negative-weight cycle, a currency arbitrage is detected.

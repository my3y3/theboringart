// Set mainnet.contract after the Colour Routine FA2 contract is deployed.
// Current Shadownet test deployment. Update only after a new test origination.
window.COLOUR_ROUTINE = {
  collectionName: "Colour Routine",
  networks: {
    shadownet: {
      label: "Shadownet",
      api: "https://api.shadownet.tzkt.io/v1",
      rpc: "https://rpc.tzkt.io/shadownet",
      beacon: "shadownet",
      contract: "KT1Kbek67qdgchnxeWa9GLzgyBisg5NHKwgC",
      explorer: "https://shadownet.tzkt.io/",
      market: "https://shadownet.objkt.com/tokens/"
    },
    mainnet: {
      label: "Mainnet",
      api: "https://api.tzkt.io/v1",
      rpc: "https://rpc.tzkt.io/mainnet",
      beacon: "mainnet",
      contract: "KT1NRdWrNaKfUoWQaN9JGPbVUfFbicpqdmDq",
      explorer: "https://tzkt.io/",
      market: "https://objkt.com/tokens/"
    }
  }
};

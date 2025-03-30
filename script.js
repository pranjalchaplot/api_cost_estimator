document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const inputCostEl = document.getElementById("inputCost");
  const outputCostEl = document.getElementById("outputCost");
  const scopeRadios = document.querySelectorAll('input[name="projectScope"]');
  const customTokensEl = document.getElementById("customTokens");
  const estimatedTokensDisplayEl = document.getElementById(
    "estimatedTokensDisplay"
  );
  const estimatedCostDisplayEl = document.getElementById(
    "estimatedCostDisplay"
  );

  // --- Configuration ---
  // Define estimated total tokens for different project scopes
  // These numbers include prompt, response, revisions, debugging overhead etc.
  // Adjust these based on your experience!
  const PROJECT_TOKEN_ESTIMATES = {
    quick: 50000, // e.g., A simple script, short analysis, few iterations
    feature: 500000, // e.g., Developing a component, complex summary, more debugging
    module: 5000000, // e.g., A larger application module, extensive research/generation
    custom: 0, // Placeholder, will be read from input
  };

  // Assume a rough split between input and output tokens
  // (e.g., 60% input, 40% output). Adjust if needed.
  const INPUT_TOKEN_RATIO = 0.6;
  const OUTPUT_TOKEN_RATIO = 0.4;

  // --- Functions ---

  /**
   * Calculates the estimated cost based on current inputs.
   */
  function calculateAndDisplayCost() {
    // Get costs per million tokens
    const inputCostPerMillion = parseFloat(inputCostEl.value) || 0;
    const outputCostPerMillion = parseFloat(outputCostEl.value) || 0;

    // Determine selected scope and total tokens
    let selectedScope = "quick"; // Default
    let totalTokens = PROJECT_TOKEN_ESTIMATES.quick;

    scopeRadios.forEach((radio) => {
      if (radio.checked) {
        selectedScope = radio.value;
      }
    });

    if (selectedScope === "custom") {
      totalTokens = parseInt(customTokensEl.value.replace(/,/g, "")) || 0; // Allow commas in input
      // Enable/Disable custom input
      customTokensEl.disabled = false;
    } else {
      totalTokens = PROJECT_TOKEN_ESTIMATES[selectedScope];
      // Ensure custom input is disabled if not selected
      customTokensEl.disabled = true;
      // Optional: Clear custom input when switching away
      // customTokensEl.value = '';
    }

    // Calculate token split
    const inputTokens = totalTokens * INPUT_TOKEN_RATIO;
    const outputTokens = totalTokens * OUTPUT_TOKEN_RATIO;

    // Calculate costs
    const costForInput = (inputTokens / 1000000) * inputCostPerMillion;
    const costForOutput = (outputTokens / 1000000) * outputCostPerMillion;
    const totalCost = costForInput + costForOutput;

    // Display results
    estimatedTokensDisplayEl.textContent = `Tokens: ~${totalTokens.toLocaleString()} (In: ${inputTokens.toLocaleString()}, Out: ${outputTokens.toLocaleString()})`;
    estimatedCostDisplayEl.textContent = `$${totalCost.toFixed(2)}`; // Format to 2 decimal places
  }

  // --- Event Listeners ---
  inputCostEl.addEventListener("input", calculateAndDisplayCost);
  outputCostEl.addEventListener("input", calculateAndDisplayCost);
  customTokensEl.addEventListener("input", calculateAndDisplayCost);

  scopeRadios.forEach((radio) => {
    radio.addEventListener("change", calculateAndDisplayCost);
  });

  // --- Initial Calculation ---
  // Optional: Load saved values from storage here if implemented
  calculateAndDisplayCost(); // Calculate on load based on defaults
});

document.addEventListener("DOMContentLoaded", () => {
  // === Main Form Elements ===
  const inputCostEl = document.getElementById("inputCost");
  const outputCostEl = document.getElementById("outputCost");
  const scopeSliderEl = document.getElementById("scopeSlider");
  const selectedScopeNameEl = document.getElementById("selectedScopeName");
  const sliderLabelsContainer = document.getElementById(
    "sliderLabelsContainer"
  );

  const customScopeInputContainerEl = document.getElementById(
    "customScopeInputContainer"
  );
  const customTokensEl = document.getElementById("customTokens");
  const estimatedTokensDisplayEl = document.getElementById(
    "estimatedTokensDisplay"
  );
  const estimatedCostDisplayEl = document.getElementById(
    "estimatedCostDisplay"
  );
  const manageButton = document.getElementById("manageButton");

  // === Modal Elements ===
  const manageModal = document.getElementById("manageModal");
  const closeModalButton = document.getElementById("closeModalButton");
  const modalCalculationNameEl = document.getElementById(
    "modalCalculationName"
  );
  const modalSaveButton = document.getElementById("modalSaveButton");
  const modalLoadButton = document.getElementById("modalLoadButton");
  const modalDeleteButton = document.getElementById("modalDeleteButton");
  const modalSavedCalculationsSelect = document.getElementById(
    "modalSavedCalculations"
  );
  const modalStatusMessageEl = document.getElementById("modalStatusMessage");

  // === Configuration ===
  const PROJECT_SCOPES = [
    { name: "Quick Task", tokens: 50000 },
    { name: "Feature Dev", tokens: 500000 },
    { name: "Full Module", tokens: 5000000 },
    { name: "Custom", tokens: 0 },
  ];
  const INPUT_TOKEN_RATIO = 0.6;
  const OUTPUT_TOKEN_RATIO = 0.4;
  const STORAGE_KEY = "savedLLMCalculations";
  let isLoadListPopulated = false;

  // === Functions ===

  /** Displays status message inside the modal */
  function showModalStatusMessage(message, isError = false, duration = 3500) {
    modalStatusMessageEl.textContent = message;
    modalStatusMessageEl.classList.toggle("error", isError);
    if (duration > 0) {
      setTimeout(() => {
        modalStatusMessageEl.textContent = "";
        modalStatusMessageEl.classList.remove("error");
      }, duration);
    }
  }

  /** Gets saved calculations from localStorage */
  function getSavedCalculations() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error("Error reading from localStorage:", e);
      showModalStatusMessage("Error reading saved data.", true, 0);
      return {};
    }
  }

  /** Saves calculations object to localStorage */
  function saveCalculations(calculations) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(calculations));
      return true;
    } catch (e) {
      console.error("Error saving to localStorage:", e);
      if (e.name === "QuotaExceededError") {
        showModalStatusMessage("Storage full. Cannot save.", true, 0);
      } else {
        showModalStatusMessage("Error saving data.", true, 0);
      }
      return false;
    }
  }

  /** Populates the saved calculations dropdown inside the modal */
  function populateLoadList() {
    const calculations = getSavedCalculations();
    const names = Object.keys(calculations).sort();

    modalSavedCalculationsSelect.innerHTML =
      '<option value="">-- Select Calculation --</option>';

    names.forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      modalSavedCalculationsSelect.appendChild(option);
    });

    // Disable load/delete buttons if list is empty
    modalLoadButton.disabled = names.length === 0;
    modalDeleteButton.disabled = names.length === 0;
    isLoadListPopulated = true;
  }

  /** Updates the main UI scope display */
  function updateScopeSelection(triggerCalculation = true) {
    const sliderValue = parseInt(scopeSliderEl.value);
    if (
      isNaN(sliderValue) ||
      sliderValue < 0 ||
      sliderValue >= PROJECT_SCOPES.length
    )
      return;

    const selectedScope = PROJECT_SCOPES[sliderValue];

    // Update text display (FIX: Only show the scope name once)
    selectedScopeNameEl.textContent = selectedScope.name;

    // Update custom input visibility
    customScopeInputContainerEl.classList.toggle(
      "visible",
      selectedScope.name === "Custom"
    );

    // Highlight Active Slider Label
    const labels = sliderLabelsContainer.querySelectorAll("span");
    labels.forEach((label, index) => {
      label.classList.toggle("active", index === sliderValue);
    });

    if (triggerCalculation) calculateAndDisplayCost();
  }

  /** Calculates and displays the estimated cost in the main UI */
  function calculateAndDisplayCost() {
    const inputCostPerMillion = parseFloat(inputCostEl.value) || 0;
    const outputCostPerMillion = parseFloat(outputCostEl.value) || 0;
    const sliderValue = parseInt(scopeSliderEl.value);
    if (
      isNaN(sliderValue) ||
      sliderValue < 0 ||
      sliderValue >= PROJECT_SCOPES.length
    )
      return;

    const selectedScope = PROJECT_SCOPES[sliderValue];
    let totalTokens =
      selectedScope.name === "Custom"
        ? parseInt(customTokensEl.value.replace(/,/g, "")) || 0
        : selectedScope.tokens;

    const inputTokens = totalTokens * INPUT_TOKEN_RATIO;
    const outputTokens = totalTokens * OUTPUT_TOKEN_RATIO;
    const costForInput = (inputTokens / 1000000) * inputCostPerMillion;
    const costForOutput = (outputTokens / 1000000) * outputCostPerMillion;
    const totalCost = costForInput + costForOutput;

    let tokenBreakdown =
      totalTokens > 0
        ? `(In: ${inputTokens.toLocaleString()}, Out: ${outputTokens.toLocaleString()})`
        : "";
    estimatedTokensDisplayEl.textContent = `Tokens: ~${totalTokens.toLocaleString()} ${tokenBreakdown}`;
    estimatedCostDisplayEl.textContent = `$${totalCost.toFixed(2)}`;
  }

  // === Modal Open/Close Logic ===
  function openModal() {
    if (!isLoadListPopulated) {
      // Populate list only if not already done
      populateLoadList();
    }
    // Clear previous name/status when opening
    modalCalculationNameEl.value = "";
    modalStatusMessageEl.textContent = "";
    modalStatusMessageEl.classList.remove("error");

    // FIX: Make sure the modal displays correctly
    manageModal.style.display = "flex";
    console.log("Modal should be open now:", manageModal.style.display);
  }

  function closeModal() {
    manageModal.style.display = "none";
    console.log("Modal should be closed now:", manageModal.style.display);
  }

  // FIX: Ensure event listeners are properly attached
  manageButton.addEventListener("click", () => {
    console.log("Manage button clicked");
    openModal();
  });

  closeModalButton.addEventListener("click", closeModal);

  // Close modal if clicking outside the content area
  manageModal.addEventListener("click", (event) => {
    if (event.target === manageModal) {
      closeModal();
    }
  });

  // === Event Handlers for Modal Save/Load/Delete ===
  modalSaveButton.addEventListener("click", () => {
    const name = modalCalculationNameEl.value.trim();
    if (!name) {
      showModalStatusMessage("Please enter a name for the calculation.", true);
      modalCalculationNameEl.focus();
      return;
    }

    const calculations = getSavedCalculations();
    calculations[name] = {
      name: name,
      inputCost: parseFloat(inputCostEl.value) || 0,
      outputCost: parseFloat(outputCostEl.value) || 0,
      scopeIndex: parseInt(scopeSliderEl.value),
      customTokensValue: customTokensEl.value,
    };

    if (saveCalculations(calculations)) {
      populateLoadList();
      modalSavedCalculationsSelect.value = name;
      showModalStatusMessage(
        `Calculation "${name}" saved successfully.`,
        false
      );
    }
  });

  modalLoadButton.addEventListener("click", () => {
    const name = modalSavedCalculationsSelect.value;
    if (!name) {
      showModalStatusMessage("Please select a calculation to load.", true);
      return;
    }
    const calculations = getSavedCalculations();
    const data = calculations[name];

    if (!data) {
      showModalStatusMessage(`Error: Could not find data for "${name}".`, true);
      return;
    }

    // Update MAIN FORM elements
    inputCostEl.value = data.inputCost;
    outputCostEl.value = data.outputCost;
    scopeSliderEl.value = data.scopeIndex;
    customTokensEl.value = data.customTokensValue || "";

    // Update main UI scope display & calculation
    updateScopeSelection(true);

    // Provide feedback in modal before closing
    showModalStatusMessage(`Calculation "${name}" loaded.`, false, 1500);
    setTimeout(closeModal, 500);
  });

  modalDeleteButton.addEventListener("click", () => {
    const name = modalSavedCalculationsSelect.value;
    if (!name) {
      showModalStatusMessage("Please select a calculation to delete.", true);
      return;
    }

    const calculations = getSavedCalculations();
    if (calculations[name]) {
      delete calculations[name];
      if (saveCalculations(calculations)) {
        populateLoadList();
        modalCalculationNameEl.value = "";
        showModalStatusMessage(`Calculation "${name}" deleted.`, false);
      }
    } else {
      showModalStatusMessage(
        `Error: Could not find "${name}" to delete.`,
        true
      );
    }
  });

  // === Main Form Event Listeners ===
  inputCostEl.addEventListener("input", calculateAndDisplayCost);
  outputCostEl.addEventListener("input", calculateAndDisplayCost);
  customTokensEl.addEventListener("input", calculateAndDisplayCost);
  scopeSliderEl.addEventListener("input", () => updateScopeSelection(true));

  // === Initial Setup ===
  // Make sure custom input is initially hidden
  customScopeInputContainerEl.classList.remove("visible");

  // Set initial scope display and calculate cost for main form
  updateScopeSelection(true);

  // Set default values if needed
  if (!inputCostEl.value) inputCostEl.value = "0.50";
  if (!outputCostEl.value) outputCostEl.value = "1.50";
});

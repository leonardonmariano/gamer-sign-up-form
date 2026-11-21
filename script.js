const form = document.getElementById("signup-form");
const fieldset = form.querySelector(".form__fields");
const submitBtn = form.querySelector(".form__submit");
const formStatus = document.getElementById("form-status");

const successView = document.getElementById("success");
const successTitle = document.getElementById("success-title");
const successName = document.getElementById("success-name");

const operatorId = document.getElementById("operator-id");
const readyCounts = document.querySelectorAll(".ready-count");

const meter = document.querySelector(".strength");
const strengthLabel = document.querySelector(".strength__label");
const strengthPrefix = document.getElementById("strength-prefix");
const strengthValue = document.getElementById("password-strength");

const inputs = {
  callsign: document.getElementById("callsign"),
  email: document.getElementById("email"),
  password: document.getElementById("password"),
  confirm: document.getElementById("confirm"),
  terms: document.getElementById("terms"),
};

// um campo só passa a ser validado depois de "checado"
// (perdeu o foco com algo escrito, ou o form foi enviado)
const checked = {
  callsign: false,
  email: false,
  password: false,
  confirm: false,
  terms: false,
};

let isSubmitting = false;

// cada regra devolve null se estiver ok, ou a mensagem + código pro painel do Operator ID
const rules = {
  callsign(value) {
    const callsign = value.trim();

    if (callsign === "") return { message: "Enter a callsign", code: "Missing" };
    if (callsign.length < 3) return { message: "Use at least 3 characters", code: "Too short" };
    if (callsign.length > 20) return { message: "Use 20 characters or fewer", code: "Too long" };
    if (!/^[A-Za-z0-9_-]+$/.test(callsign)) {
      return { message: "Use letters, numbers, _ or - only", code: "Bad character" };
    }
    return null;
  },

  email(value) {
    if (value.trim() === "") return { message: "Enter your email", code: "Missing" };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
      return { message: "Enter a valid email, like you@example.com", code: "Malformed" };
    }
    return null;
  },

  password(value) {
    if (value === "") return { message: "Enter a password", code: "Missing" };
    if (value.length < 8) return { message: "Use at least 8 characters", code: "Too short" };
    return null;
  },

  confirm(value) {
    if (value === "") return { message: "Confirm your password", code: "Missing" };
    if (value !== inputs.password.value) return { message: "Passwords don't match", code: "Mismatch" };
    return null;
  },

  terms(isChecked) {
    if (!isChecked) return { message: "Accept the terms to continue", code: "Required" };
    return null;
  },
};

function getValue(name) {
  if (name === "terms") return inputs.terms.checked;
  return inputs[name].value;
}

function getMessage(name) {
  return document.getElementById(name + "-msg");
}

// guarda o texto de dica original pra poder voltar depois do erro
document.querySelectorAll(".field__msg").forEach((msg) => {
  msg.dataset.hint = msg.textContent;
});

function checkField(name) {
  const input = inputs[name];
  const field = input.closest(".field");
  const msg = getMessage(name);
  const error = rules[name](getValue(name));

  if (error) {
    field.classList.add("field--error");
    field.classList.remove("field--valid");
    input.setAttribute("aria-invalid", "true");
    msg.textContent = error.message;
  } else {
    field.classList.remove("field--error");
    field.classList.add("field--valid");
    input.removeAttribute("aria-invalid");
    msg.textContent = msg.dataset.hint;
  }

  updateReadout();
  return !error;
}

function clearField(name) {
  const input = inputs[name];
  const msg = getMessage(name);

  input.closest(".field").classList.remove("field--error");
  input.removeAttribute("aria-invalid");
  msg.textContent = msg.dataset.hint;
  updateReadout();
}

/* ---------- Força da senha ---------- */

const strengthNames = ["", "Weak", "Fair", "Good", "Strong"];

function getStrength(password) {
  if (password.length === 0) return 0;
  if (password.length < 8) return 1;

  let score = 1;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  return Math.min(score, 4);
}

function updateStrength() {
  const level = getStrength(inputs.password.value);
  const name = strengthNames[level];

  meter.dataset.level = level;
  strengthValue.textContent = name;
  strengthPrefix.hidden = level === 0;
  strengthLabel.className = "strength__label " + name.toLowerCase();
}

/* ---------- Painel Operator ID ---------- */

function setReadyCount(text, done) {
  readyCounts.forEach((el) => {
    el.textContent = text;
    el.classList.toggle("is-done", done);
  });
}

function updateReadout() {
  let ready = 0;

  Object.keys(rules).forEach((name) => {
    const status = document.querySelector(`[data-row="${name}"]`);
    const error = rules[name](getValue(name));
    const hasError = inputs[name].closest(".field").classList.contains("field--error");

    status.classList.remove("is-ok", "is-error");

    if (!error) {
      ready++;
      status.textContent = "OK";
      status.classList.add("is-ok");
    } else if (hasError) {
      status.textContent = error.code;
      status.classList.add("is-error");
    } else {
      status.textContent = name === "terms" ? "Required" : "Pending";
    }
  });

  setReadyCount(`${ready}/5 ready`, ready === 5);

  const callsign = inputs.callsign.value.trim();
  if (rules.callsign(callsign)) {
    operatorId.textContent = "Unassigned";
    operatorId.classList.add("is-empty");
  } else {
    operatorId.textContent = callsign;
    operatorId.classList.remove("is-empty");
  }
}

/* ---------- Eventos dos campos ---------- */

["callsign", "email", "password", "confirm"].forEach((name) => {
  const input = inputs[name];

  input.addEventListener("blur", () => {
    if (isSubmitting) return;

    if (input.value !== "" || checked[name]) {
      checked[name] = true;
      checkField(name);
    }
  });

  input.addEventListener("input", () => {
    if (checked[name]) checkField(name);

    if (name === "password") {
      updateStrength();
      if (checked.confirm) checkField("confirm");
    }

    updateReadout();
  });
});

// o erro dos termos só aparece no submit e some quando o checkbox muda
inputs.terms.addEventListener("change", () => {
  clearField("terms");
});

/* ---------- Mostrar / esconder senha ---------- */

const toggleButtons = document.querySelectorAll(".field__toggle");

function setPasswordVisible(button, visible) {
  const input = document.getElementById(button.getAttribute("aria-controls"));
  const icon = button.querySelector("img");

  input.type = visible ? "text" : "password";
  button.setAttribute("aria-pressed", visible);
  icon.src = visible ? "./assets/images/icon-eye-off.svg" : "./assets/images/icon-eye.svg";
}

toggleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const visible = button.getAttribute("aria-pressed") === "true";
    setPasswordVisible(button, !visible);
  });
});

/* ---------- Envio ---------- */

function announce(text) {
  // limpa antes pro leitor de tela anunciar de novo mesmo se o texto for igual
  formStatus.textContent = "";
  setTimeout(() => {
    formStatus.textContent = text;
  }, 100);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (isSubmitting) return;

  const invalid = [];

  Object.keys(rules).forEach((name) => {
    checked[name] = true;
    if (!checkField(name)) invalid.push(name);
  });

  if (invalid.length > 0) {
    inputs[invalid[0]].focus();
    announce(invalid.length === 1 ? "1 field needs attention" : `${invalid.length} fields need attention`);
    return;
  }

  isSubmitting = true;
  toggleButtons.forEach((button) => setPasswordVisible(button, false));
  fieldset.disabled = true;

  submitBtn.classList.add("is-loading");
  submitBtn.setAttribute("aria-disabled", "true");
  submitBtn.textContent = "Transmitting_";
  announce("Transmitting");

  // não tem servidor, então só simula a espera
  setTimeout(showSuccess, 2000);
});

function showSuccess() {
  successName.textContent = inputs.callsign.value.trim();

  form.hidden = true;
  successView.hidden = false;
  successTitle.focus();

  document.querySelectorAll(".readout__status").forEach((status) => {
    status.textContent = "Locked";
    status.classList.remove("is-error");
    status.classList.add("is-ok");
  });
  setReadyCount("Provisioned", true);
}

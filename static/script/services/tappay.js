import {
  showInputMessage,
  setInputSuccess,
  clearInputMessage,
} from "../components/utils.js";

const config = {
  APP_ID: "166467",
  APP_KEY: "app_oVxEwX3Mfw1awj5LG2DQo9kT5BIAsFvX3Nnv83LQwkChcJtiq1cipiWLZZjF",
};

const cardNumInput = document.querySelector("#card-number");
const cardExpiryInput = document.querySelector("#card-expiration-date");
const cardCCVInput = document.querySelector("#card-ccv");

let canGetPrime = false;
let currentCardType = "unknown";

export function initTapPay() {
  try {
    TPDirect.setupSDK(config.APP_ID, config.APP_KEY, "sandbox");

    TPDirect.card.setup({
      fields: {
        number: {
          element: "#card-number",
          placeholder: "**** **** **** ****",
        },
        expirationDate: {
          element: "#card-expiration-date",
          placeholder: "MM / YY",
        },
        ccv: {
          element: "#card-ccv",
          placeholder: "ccv",
        },
      },
      styles: {
        input: {
          "font-size": "16px",
          color: "#666666",
        },
        "input.ccv": {
          "font-size": "16px",
        },
        ":focus": {
          color: "#66afe9",
        },
        ".valid": {
          color: "green",
        },
        ".invalid": {
          color: "red",
        },
        "@media screen and (max-width: 400px)": {
          input: {
            color: "orange",
          },
        },
      },

      // 此設定會顯示卡號輸入正確後，會顯示前六後四碼信用卡卡號
      isMaskCreditCardNumber: true,
      maskCreditCardNumberRange: {
        beginIndex: 6,
        endIndex: 11,
      },
    });

    // 監聽卡片輸入狀態
    TPDirect.card.onUpdate((update) => {
      console.log("TapPay onUpdate", update);
      // 更新卡片類型
      currentCardType = update.cardType;

      // 更新 canGetPrime 狀態
      canGetPrime = update.canGetPrime;

      if (update.status.number === 0) {
        setInputSuccess(cardNumInput);
      } else if (update.status.number === 2) {
        showInputMessage(cardNumInput, "卡號格式錯誤");
      } else {
        clearInputMessage(cardNumInput);
      }

      if (update.status.expiry === 0) {
        setInputSuccess(cardExpiryInput);
      } else if (update.status.expiry === 2) {
        showInputMessage(cardExpiryInput, "過期時間格式錯誤");
      } else {
        clearInputMessage(cardExpiryInput);
      }

      if (update.status.ccv === 0) {
        setInputSuccess(cardCCVInput);
      } else if (update.status.ccv === 2) {
        showInputMessage(cardCCVInput, "驗證碼格式錯誤");
      } else {
        clearInputMessage(cardCCVInput);
      }

      // 顯示卡片類型
      displayCardTypeIcon(update.cardType);
    });

    console.log("TapPay SDK 初始化成功");
  } catch (err) {
    console.error("TapPay 初始化錯誤", err);
    throw err;
  }
}

// 顯示卡片類型 icon
function displayCardTypeIcon(cardType) {
  // cardTypes = ['mastercard', 'visa', 'jcb', 'amex', 'unionpay','unknown']
  const cardTypeMap = {
    visa: "Visa",
    mastercard: "Mastercard",
    jcb: "JCB",
    amex: "American Express",
    unionpay: "Unionpay",
    unknown: "",
  };

  const cardTypeName = cardTypeMap[cardType] || "";
  console.log("信用卡類型:", cardTypeName || "未知");
}

export async function getPrime() {
  const tappayStatus = TPDirect.card.getTappayFieldsStatus();
  console.log("TapPay 狀態:", tappayStatus);

  clearInputMessage(cardNumInput);
  clearInputMessage(cardExpiryInput);
  clearInputMessage(cardCCVInput);

  // 檢查各欄位狀態
  let hasError = false;

  if (tappayStatus.status.number === 0) {
    setInputSuccess(cardNumInput);
  } else if (tappayStatus.status.number === 1) {
    showInputMessage(cardNumInput, "請輸入卡號");
    hasError = true;
  } else if (tappayStatus.status.number === 2) {
    showInputMessage(cardNumInput, "卡號格式錯誤");
    hasError = true;
  }

  if (tappayStatus.status.expiry === 0) {
    setInputSuccess(cardExpiryInput);
  } else if (tappayStatus.status.expiry === 1) {
    showInputMessage(cardExpiryInput, "請輸入過期時間");
    hasError = true;
  } else if (tappayStatus.status.expiry === 2) {
    showInputMessage(cardExpiryInput, "過期時間格式錯誤");
    hasError = true;
  }

  if (tappayStatus.status.ccv !== 0) {
    setInputSuccess(cardCCVInput);
  } else if (tappayStatus.status.ccv === 1) {
    showInputMessage(cardCCVInput, "請輸入驗證碼");
    hasError = true;
  } else if (tappayStatus.status.ccv === 2) {
    showInputMessage(cardCCVInput, "驗證碼格式錯誤");
    hasError = true;
  }

  // 有任何錯誤則拋出異常
  if (hasError || !tappayStatus.canGetPrime) {
    throw new Error("信用卡資訊格式錯誤");
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("取得 Prime 逾時，請重試"));
    }, 10000);

    TPDirect.card.getPrime((result) => {
      clearTimeout(timeout);
      console.log("Get Prime 結果:", result);

      if (result.status !== 0) {
        console.error("取得 Prime 失敗:", result.msg);
        reject(new Error(result.msg || "取得 Prime 失敗"));
        return;
      }

      console.log("Prime 取得成功", result.card.prime);
      console.log("卡片類型:", result.card.type);
      resolve(result.card.prime);
    });
  });
}

export function checkCanGetPrime() {
  return canGetPrime;
}

export function getCurrentCardType() {
  return currentCardType;
}

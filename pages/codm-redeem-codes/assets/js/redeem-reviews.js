import { db } from "../../../../assets/js/firebase-config.js";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

let cachedReviews = [];

// Unique Device Fingerprint Specific to the Redeem Codes Hub
let deviceToken = localStorage.getItem("vile_tempest_redeem_device_token");
if (!deviceToken) {
  deviceToken =
    "dev_redeem_" +
    Math.random().toString(36).substring(2) +
    Date.now().toString(36);
  localStorage.setItem("vile_tempest_redeem_device_token", deviceToken);
}

let isEditingMode = false;
let editingDocId = null;
let isSubmittingLock = false; // Hard execution lock to stop double triggers

// Initialize once globally per session lifecycle
if (!window.__redeemHubScriptLoaded) {
  window.__redeemHubScriptLoaded = true;

  document.addEventListener("DOMContentLoaded", () => {
    const submitBtn = document.getElementById("submit-review-btn");
    if (submitBtn && !submitBtn.dataset.bound) {
      submitBtn.dataset.bound = "true";
      submitBtn.addEventListener("click", (e) => {
        e.preventDefault();
        submitUserReview();
      });
    }

    initRealtimeReviewsFeed();
  });
}

async function submitUserReview() {
  if (isSubmittingLock) return; // Prevent concurrent execution instantly
  isSubmittingLock = true;

  try {
    const nameInput = document.getElementById("reviewer-name");
    const typeSelect = document.getElementById("review-type");
    const utilitySelect = document.getElementById("utility-name");
    const ratingSelect = document.getElementById("review-rating");
    const commentInput = document.getElementById("review-comment");
    const termsCheckbox = document.getElementById("review-terms-checkbox");

    const enteredName = nameInput.value.trim();
    const reviewType = typeSelect ? typeSelect.value : "Utilities";
    const specificUtility = utilitySelect
      ? utilitySelect.value
      : "CODM Redeem Codes Hub";
    const rating = parseInt(ratingSelect.value);
    const comment = commentInput.value.trim();

    if (termsCheckbox && !termsCheckbox.checked) {
      alert(
        "You must agree to the Terms & Privacy Policy before submitting your review.",
      );
      return;
    }

    if (!comment) {
      alert("Please write a review comment before submitting.");
      return;
    }

    // Filter cached reviews specifically for this tool hub only
    const redeemReviews = cachedReviews.filter(
      (r) => r.specificUtility === "CODM Redeem Codes Hub",
    );

    if (!isEditingMode) {
      const existingDeviceReview = redeemReviews.find(
        (r) => r.deviceToken === deviceToken,
      );
      if (existingDeviceReview) {
        alert(
          "This device has already submitted a review for the Redeem Codes Hub. You can edit your existing review using the panel below.",
        );
        return;
      }
    }

    let finalAuthor = "";
    if (enteredName) {
      const nameExists = redeemReviews.some(
        (r) =>
          r.author &&
          r.author.toLowerCase() === enteredName.toLowerCase() &&
          (!isEditingMode || r.id !== editingDocId),
      );

      if (nameExists) {
        alert(
          `The handle "${enteredName}" is already taken by another reviewer. Please choose a different name.`,
        );
        nameInput.focus();
        return;
      }
      finalAuthor = enteredName;
    } else {
      finalAuthor = generateUniqueAnonymousTag(redeemReviews);
    }

    toggleSubmitState(true, isEditingMode);

    if (isEditingMode && editingDocId) {
      const myReview = redeemReviews.find((r) => r.id === editingDocId);
      const hasNoChanges =
        myReview &&
        myReview.author === finalAuthor &&
        myReview.rating === rating &&
        myReview.comment === comment;

      if (hasNoChanges) {
        alert("No changes were made to your review.");
        isEditingMode = false;
        editingDocId = null;
        renderUserDeviceReviewPanel(redeemReviews);
        return;
      }

      const reviewRef = doc(db, "site_reviews", editingDocId);
      await updateDoc(reviewRef, {
        author: finalAuthor,
        reviewType: reviewType,
        specificUtility: specificUtility,
        rating: rating,
        comment: comment,
        timestamp: new Date(),
      });
      alert("Your review has been successfully updated!");
      isEditingMode = false;
      editingDocId = null;
    } else {
      await addDoc(collection(db, "site_reviews"), {
        deviceToken: deviceToken,
        author: finalAuthor,
        reviewType: reviewType,
        specificUtility: specificUtility,
        rating: rating,
        comment: comment,
        timestamp: new Date(),
        isApproved: true,
      });
      alert("Your review has been successfully submitted!");
    }

    nameInput.value = "";
    commentInput.value = "";
    if (termsCheckbox) termsCheckbox.checked = false;
  } catch (error) {
    console.error("Error writing document: ", error);
    alert("Failed to submit review. Please try again.");
  } finally {
    toggleSubmitState(false, false);
    setTimeout(() => {
      isSubmittingLock = false; // Release lock after execution finishes
    }, 400);
  }
}

function generateUniqueAnonymousTag(redeemReviews) {
  const baseName = "Anonymous Traveler";
  if (redeemReviews.length > 0) {
    const latestReview = redeemReviews[0];
    const latestAuthor = latestReview.author || "";
    if (latestAuthor.startsWith(baseName)) {
      const parts = latestAuthor.split("#");
      if (parts.length > 1) {
        const numericVal = parseInt(parts[1].trim(), 10);
        if (!isNaN(numericVal)) {
          return `${baseName} #${numericVal + 1}`;
        }
      }
    }
  }
  const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString(16);
  return `${baseName} #${randomSuffix}`;
}

function toggleSubmitState(isSubmitting, editing = false) {
  const btn = document.getElementById("submit-review-btn");
  if (!btn) return;
  btn.disabled = isSubmitting;
  btn.textContent = isSubmitting
    ? editing
      ? "Updating..."
      : "Submitting..."
    : editing
      ? "Update Review"
      : "Submit Review";
}

function initRealtimeReviewsFeed() {
  const q = query(collection(db, "site_reviews"), orderBy("timestamp", "desc"));

  onSnapshot(
    q,
    (querySnapshot) => {
      cachedReviews = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.isApproved !== false) {
          cachedReviews.push({ id: docSnap.id, ...data });
        }
      });

      const redeemReviews = cachedReviews.filter(
        (r) => r.specificUtility === "CODM Redeem Codes Hub",
      );
      updatePlayStoreAnalytics(redeemReviews);
      renderUserDeviceReviewPanel(redeemReviews);
      renderReviewsFeed(redeemReviews);
    },
    (error) => {
      console.error("Error listening to reviews stream:", error);
      const feedContainer = document.getElementById("reviews-feed-container");
      if (feedContainer) {
        feedContainer.innerHTML = `<p class="redeem-loading-text">Failed to stream reviews.</p>`;
      }
    },
  );
}

function renderUserDeviceReviewPanel(redeemReviews) {
  let panelContainer = document.getElementById("user-device-review-panel");
  const formCard = document.querySelector(".redeem-form-card");
  if (!formCard) return;

  if (!panelContainer) {
    panelContainer = document.createElement("div");
    panelContainer.id = "user-device-review-panel";
    formCard.parentNode.insertBefore(panelContainer, formCard);
  }

  const myReview = redeemReviews.find((r) => r.deviceToken === deviceToken);

  if (myReview) {
    formCard.style.display = "none";
    panelContainer.innerHTML = `
      <div class="redeem-review-item" style="border-color: var(--accent-cyan); margin-bottom: 14px;">
        <div class="redeem-review-top">
          <span style="color: var(--accent-cyan); font-weight: 700; font-size: 0.75rem;"><i class="fa-solid fa-circle-check"></i> Your Published Review</span>
          <button type="button" id="trigger-edit-review-btn" style="background: transparent; border: 1px solid var(--accent-cyan); color: var(--accent-cyan); padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; cursor: pointer;">
            Edit
          </button>
        </div>
        <div style="margin-top: 6px;">
          <strong class="redeem-review-author">${escapeHtml(myReview.author)}</strong>
          <span class="redeem-review-stars">${"★".repeat(myReview.rating) + "☆".repeat(5 - myReview.rating)}</span>
          <p class="redeem-review-comment">${escapeHtml(myReview.comment)}</p>
        </div>
      </div>
    `;
    panelContainer.style.display = "block";

    const editBtn = document.getElementById("trigger-edit-review-btn");
    if (editBtn && !editBtn.dataset.bound) {
      editBtn.dataset.bound = "true";
      editBtn.addEventListener("click", () => {
        isEditingMode = true;
        editingDocId = myReview.id;
        formCard.style.display = "block";

        document.getElementById("reviewer-name").value =
          myReview.author.startsWith("Anonymous Traveler")
            ? ""
            : myReview.author;
        document.getElementById("review-rating").value = myReview.rating || 5;
        document.getElementById("review-comment").value =
          myReview.comment || "";
        document.getElementById("review-terms-checkbox").checked = true;

        const submitBtn = document.getElementById("submit-review-btn");
        if (submitBtn) submitBtn.textContent = "Update Review";

        formCard.scrollIntoView({ behavior: "smooth" });
      });
    }
  } else {
    formCard.style.display = "block";
    panelContainer.innerHTML = "";
    panelContainer.style.display = "none";
    isEditingMode = false;
    editingDocId = null;
  }
}

function updatePlayStoreAnalytics(reviews) {
  const avgScoreElem = document.getElementById("play-store-avg-score");
  const avgStarsElem = document.getElementById("play-store-avg-stars");
  const totalReviewsElem = document.getElementById("play-store-total-reviews");

  if (!avgScoreElem) return;

  if (reviews.length === 0) {
    avgScoreElem.textContent = "0.0";
    avgStarsElem.textContent = "☆☆☆☆☆";
    totalReviewsElem.textContent = "0 reviews";
    for (let i = 1; i <= 5; i++) {
      const bar = document.getElementById(`bar-${i}`);
      if (bar) bar.style.width = "0%";
    }
    return;
  }

  let totalScore = 0;
  const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  reviews.forEach((r) => {
    totalScore += r.rating;
    if (starCounts[r.rating] !== undefined) {
      starCounts[r.rating]++;
    }
  });

  const avg = (totalScore / reviews.length).toFixed(1);
  avgScoreElem.textContent = avg;
  totalReviewsElem.textContent = `${reviews.length} review${reviews.length === 1 ? "" : "s"}`;

  const fullStars = Math.round(avg);
  avgStarsElem.textContent = "★".repeat(fullStars) + "☆".repeat(5 - fullStars);

  for (let i = 1; i <= 5; i++) {
    const bar = document.getElementById(`bar-${i}`);
    if (bar) {
      const percentage = (starCounts[i] / reviews.length) * 100;
      bar.style.width = `${percentage}%`;
    }
  }
}

function renderReviewsFeed(reviews) {
  const feedContainer = document.getElementById("reviews-feed-container");
  if (!feedContainer) return;

  feedContainer.innerHTML = "";

  if (reviews.length === 0) {
    feedContainer.innerHTML = `<p class="redeem-loading-text">No reviews found for Redeem Codes yet.</p>`;
    return;
  }

  reviews.forEach((data) => {
    const starsStr = "★".repeat(data.rating) + "☆".repeat(5 - data.rating);
    const isMyDevice = data.deviceToken === deviceToken;
    const badgeHtml = isMyDevice
      ? ` <span style="background: rgba(56, 189, 248, 0.2); color: var(--accent-cyan); font-size: 9px; font-weight: 800; padding: 1px 4px; border-radius: 3px;">YOUR REVIEW</span>`
      : "";

    const card = document.createElement("div");
    card.className = "redeem-review-item";
    card.innerHTML = `
      <div class="redeem-review-top">
        <div>
          <strong class="redeem-review-author">${escapeHtml(data.author)}</strong>${badgeHtml}
        </div>
        <span class="redeem-review-stars">${starsStr}</span>
      </div>
      <p class="redeem-review-comment">${escapeHtml(data.comment)}</p>
    `;
    feedContainer.appendChild(card);
  });
}

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

let currentFilter = "all";
let cachedReviews = [];

// Unique Device Fingerprint Setup stored in localStorage
let deviceToken = localStorage.getItem("vile_tempest_device_token");
if (!deviceToken) {
  deviceToken =
    "dev_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
  localStorage.setItem("vile_tempest_device_token", deviceToken);
}

let isEditingMode = false;
let editingDocId = null;
let isSubmittingLock = false;
let originalEditSnapshot = null; // Stores initial values when editing starts

document.addEventListener("DOMContentLoaded", () => {
  const typeSelect = document.getElementById("review-type");
  const utilityWrapper = document.getElementById("utility-conditional-wrapper");

  if (typeSelect && utilityWrapper) {
    typeSelect.addEventListener("change", function () {
      if (this.value === "Utilities") {
        utilityWrapper.classList.remove("utility-wrapper-hidden");
      } else {
        utilityWrapper.classList.add("utility-wrapper-hidden");
      }
    });
  }

  const submitBtn = document.getElementById("submit-review-btn");
  if (submitBtn && !submitBtn.dataset.bound) {
    submitBtn.dataset.bound = "true";
    submitBtn.addEventListener("click", (e) => {
      e.preventDefault();
      submitUserReview();
    });
  }

  // Filter Pill Listeners
  const filterPills = document.querySelectorAll(".play-store-pill");
  filterPills.forEach((pill) => {
    pill.addEventListener("click", function () {
      filterPills.forEach((p) => p.classList.remove("active"));
      this.classList.add("active");
      currentFilter = this.getAttribute("data-filter");
      renderReviewsFeed(cachedReviews);
    });
  });

  initRealtimeReviewsFeed();
});

async function submitUserReview() {
  if (isSubmittingLock) return;
  isSubmittingLock = true;

  const nameInput = document.getElementById("reviewer-name");
  const typeSelect = document.getElementById("review-type");
  const utilitySelect = document.getElementById("utility-name");
  const ratingSelect = document.getElementById("review-rating");
  const commentInput = document.getElementById("review-comment");
  const termsCheckbox = document.getElementById("review-terms-checkbox");

  const enteredName = nameInput.value.trim();
  const reviewType = typeSelect.value;
  const specificUtility =
    reviewType === "Utilities" ? utilitySelect.value : null;
  const rating = parseInt(ratingSelect.value);
  const comment = commentInput.value.trim();

  // 1. Validate Terms & Privacy checkbox
  if (termsCheckbox && !termsCheckbox.checked) {
    alert(
      "You must agree to the Terms & Privacy Policy before submitting your review.",
    );
    isSubmittingLock = false;
    return;
  }

  // 2. Validate comment content
  if (!comment) {
    alert("Please write a review comment before submitting.");
    isSubmittingLock = false;
    return;
  }

  let finalAuthor = "";
  if (enteredName) {
    const nameExists = cachedReviews.some(
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
      isSubmittingLock = false;
      return;
    }
    finalAuthor = enteredName;
  } else {
    finalAuthor = generateUniqueAnonymousTag();
  }

  try {
    toggleSubmitState(true, isEditingMode);

    if (isEditingMode && editingDocId) {
      // Compare current form values against the original snapshot cached when editing started
      const hasNoChanges =
        originalEditSnapshot &&
        originalEditSnapshot.author === enteredName &&
        originalEditSnapshot.reviewType === reviewType &&
        originalEditSnapshot.specificUtility === specificUtility &&
        originalEditSnapshot.rating === rating &&
        originalEditSnapshot.comment === comment;

      if (hasNoChanges) {
        alert(
          "No changes were detected in your review. Please modify the fields before saving.",
        );
        isSubmittingLock = false;
        toggleSubmitState(false, true);
        return;
      }

      // Proceed with updateDoc only if actual modifications occurred
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

      // Update local snapshot to match new saved state
      originalEditSnapshot = {
        author: enteredName,
        reviewType: reviewType,
        specificUtility: specificUtility,
        rating: rating,
        comment: comment,
      };
    } else {
      const existingDeviceReview = cachedReviews.find(
        (r) => r.deviceToken === deviceToken,
      );
      if (existingDeviceReview) {
        alert("This device has already submitted a review.");
        isSubmittingLock = false;
        toggleSubmitState(false, false);
        return;
      }

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
  } catch (error) {
    console.error("Error writing document: ", error);
    alert("Failed to submit review. Please try again.");
  } finally {
    toggleSubmitState(false, isEditingMode);
    setTimeout(() => {
      isSubmittingLock = false;
    }, 400);
  }
}

function generateUniqueAnonymousTag() {
  const baseName = "Anonymous Traveler";
  if (cachedReviews && cachedReviews.length > 0) {
    const latestReview = cachedReviews[0];
    const latestAuthor = latestReview.author || "";

    if (latestAuthor.startsWith(baseName)) {
      const parts = latestAuthor.split("#");
      if (parts.length > 1) {
        const lastTag = parts[1].trim();
        const numericVal = parseInt(lastTag, 10);
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
  if (isSubmitting) {
    btn.textContent = editing ? "Updating..." : "Submitting...";
    btn.classList.add("btn-submitting");
  } else {
    btn.textContent = editing ? "Update Review" : "Submit Review";
    btn.classList.remove("btn-submitting");
  }
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

      updatePlayStoreAnalytics(cachedReviews);
      checkAndUpdateFormMode(cachedReviews);
      renderReviewsFeed(cachedReviews);
    },
    (error) => {
      console.error("Error listening to reviews stream:", error);
      const feedContainer = document.getElementById("reviews-feed-container");
      if (feedContainer) {
        feedContainer.innerHTML = `<p class="reviews-error-text">Failed to stream reviews.</p>`;
      }
    },
  );
}

/**
 * Checks if the user has a published review. If so, automatically sets up the form
 * into "Edit Review" mode with default values loaded from their review.
 */
function checkAndUpdateFormMode(reviews) {
  const formCard = document.querySelector(".review-form-card");
  if (!formCard) return;

  const headingElem = formCard.querySelector(".review-card-heading");
  const submitBtn = document.getElementById("submit-review-btn");
  const myReview = reviews.find((r) => r.deviceToken === deviceToken);

  const nameInput = document.getElementById("reviewer-name");
  const typeSelect = document.getElementById("review-type");
  const utilityWrapper = document.getElementById("utility-conditional-wrapper");
  const utilitySelect = document.getElementById("utility-name");
  const ratingSelect = document.getElementById("review-rating");
  const commentInput = document.getElementById("review-comment");
  const termsBox = document.getElementById("review-terms-checkbox");

  if (myReview) {
    // If we just transitioned into editing mode, cache the original baseline
    if (!isEditingMode || editingDocId !== myReview.id) {
      isEditingMode = true;
      editingDocId = myReview.id;

      // Save baseline values to compare against on submit
      originalEditSnapshot = {
        author: myReview.author.startsWith("Anonymous Traveler")
          ? ""
          : myReview.author,
        reviewType: myReview.reviewType || "General Feedback",
        specificUtility: myReview.specificUtility || "CODM PTB Download Links",
        rating: myReview.rating || 5,
        comment: myReview.comment || "",
      };

      // Populate form fields only on initial entry
      if (headingElem) headingElem.textContent = "Revise Your Feedback";
      if (submitBtn) submitBtn.textContent = "Save Changes";

      if (nameInput) nameInput.value = originalEditSnapshot.author;
      if (typeSelect) typeSelect.value = originalEditSnapshot.reviewType;

      if (originalEditSnapshot.reviewType === "Utilities") {
        utilityWrapper.classList.remove("utility-wrapper-hidden");
        if (utilitySelect)
          utilitySelect.value = originalEditSnapshot.specificUtility;
      } else {
        utilityWrapper.classList.add("utility-wrapper-hidden");
      }

      if (ratingSelect) ratingSelect.value = originalEditSnapshot.rating;
      if (commentInput) commentInput.value = originalEditSnapshot.comment;
      if (termsBox) termsBox.checked = true;
    }
  } else {
    // Only reset to new review mode if not currently typing
    if (!isEditingMode) {
      if (headingElem) headingElem.textContent = "Submit Your Feedback";
      if (submitBtn) submitBtn.textContent = "Publish Feedback";
    }
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

  const filtered = reviews.filter((data) => {
    if (currentFilter === "all") return true;
    return data.reviewType === currentFilter;
  });

  if (filtered.length === 0) {
    feedContainer.innerHTML = `<p class="reviews-loading-text">No reviews found for this category.</p>`;
    return;
  }

  filtered.forEach((data) => {
    const starsStr = "★".repeat(data.rating) + "☆".repeat(5 - data.rating);
    const subCategoryText = data.specificUtility
      ? ` • ${data.specificUtility}`
      : "";
    const isMyDevice = data.deviceToken === deviceToken;
    const badgeHtml = isMyDevice
      ? `<span class="your-review-pill">Your Submission</span>`
      : "";

    const card = document.createElement("div");
    card.className = `review-item-card ${isMyDevice ? "my-device-review-highlight" : ""}`;
    card.innerHTML = `
      <div class="review-card-top-row">
        <div class="review-author-meta">
          <strong class="review-author-name">${escapeHtml(data.author)}</strong>${badgeHtml}
          <span class="review-category-badge">${escapeHtml(data.reviewType)}${escapeHtml(subCategoryText)}</span>
        </div>
        <span class="review-stars-display" title="${data.rating} out of 5 stars">${starsStr}</span>
      </div>
      <p class="review-comment-body">${escapeHtml(data.comment)}</p>
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

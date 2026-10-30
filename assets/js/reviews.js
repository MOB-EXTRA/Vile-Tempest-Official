import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCbCgCRWV4cIDjfGg0llNQXzIscnKvLc9w",
  authDomain: "vile-tempest-reviews.firebaseapp.com",
  projectId: "vile-tempest-reviews",
  storageBucket: "vile-tempest-reviews.firebasestorage.app",
  messagingSenderId: "1047163835896",
  appId: "1:1047163835896:web:93edcc036534ee83f6720d",
  measurementId: "G-DPQHEETQZR",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

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
  if (submitBtn) {
    submitBtn.addEventListener("click", submitUserReview);
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
    return;
  }

  // 2. Validate comment content
  if (!comment) {
    alert("Please write a review comment before submitting.");
    return;
  }

  // 3. Check if device has already reviewed (and we are NOT currently editing)
  if (!isEditingMode) {
    const existingDeviceReview = cachedReviews.find(
      (r) => r.deviceToken === deviceToken,
    );
    if (existingDeviceReview) {
      alert(
        "This device has already submitted a review. You can edit your existing review using the 'Your Review' panel below.",
      );
      return;
    }
  }

  let finalAuthor = "";
  if (enteredName) {
    // 4. Duplicate Name Check for Custom Nicknames (ignoring own name if editing)
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
      return;
    }
    finalAuthor = enteredName;
  } else {
    finalAuthor = generateUniqueAnonymousTag();
  }

  try {
    toggleSubmitState(true, isEditingMode);

    if (isEditingMode && editingDocId) {
      // Find the current stored review data
      const myReview = cachedReviews.find((r) => r.id === editingDocId);

      // Check if inputs match existing data exactly
      const hasNoChanges =
        myReview &&
        myReview.author === finalAuthor &&
        myReview.reviewType === reviewType &&
        myReview.specificUtility === specificUtility &&
        myReview.rating === rating &&
        myReview.comment === comment;

      if (hasNoChanges) {
        alert("No changes were made to your review.");
        // Just close the form / switch back to panel view
        isEditingMode = false;
        editingDocId = null;
        renderUserDeviceReviewPanel(cachedReviews);
        return;
      }

      // Proceed with updateDoc only if changes exist...
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
      // Create new review in Firestore
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
    }

    // Reset Form Fields
    nameInput.value = "";
    commentInput.value = "";
    if (termsCheckbox) termsCheckbox.checked = false;
    document.getElementById("review-type").value = "General Feedback";
    document
      .getElementById("utility-conditional-wrapper")
      .classList.add("utility-wrapper-hidden");

    const submitBtn = document.getElementById("submit-review-btn");
    if (submitBtn) submitBtn.textContent = "Submit Review";
  } catch (error) {
    console.error("Error writing document: ", error);
    alert("Failed to submit review. Please try again.");
  } finally {
    toggleSubmitState(false, false);
  }
}

/**
 * Fast unique tag generator for empty anonymous submissions.
 */
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
      renderUserDeviceReviewPanel(cachedReviews);
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
 * Renders Play Store style "Your Review" management panel.
 * Hides the review submission form card if the device has already posted a review.
 */
function renderUserDeviceReviewPanel(reviews) {
  let panelContainer = document.getElementById("user-device-review-panel");
  const formCard = document.querySelector(".review-form-card");
  if (!formCard) return;

  if (!panelContainer) {
    panelContainer = document.createElement("div");
    panelContainer.id = "user-device-review-panel";
    formCard.parentNode.insertBefore(panelContainer, formCard);
  }

  const myReview = reviews.find((r) => r.deviceToken === deviceToken);

  if (myReview) {
    // Hide the review input form since the device already reviewed
    formCard.style.display = "none";

    panelContainer.innerHTML = `
      <div class="user-review-status-box">
        <div class="user-review-status-header">
          <span><i class="fa-solid fa-circle-check"></i> Your Published Review</span>
          <button type="button" class="btn-edit-my-review" id="trigger-edit-review-btn">
            <i class="fa-solid fa-pen-to-square"></i> Edit Review
          </button>
        </div>
        <div class="user-review-preview-content">
          <strong>${escapeHtml(myReview.author)}</strong>
          <span class="user-review-stars">${"★".repeat(myReview.rating) + "☆".repeat(5 - myReview.rating)}</span>
          <p>${escapeHtml(myReview.comment)}</p>
        </div>
      </div>
    `;
    panelContainer.style.display = "block";

    // Attach edit listener: reveals the form card populated with current data for editing
    document
      .getElementById("trigger-edit-review-btn")
      .addEventListener("click", () => {
        isEditingMode = true;
        editingDocId = myReview.id;

        // Reveal form card
        formCard.style.display = "flex";

        // Populate form fields with current values
        document.getElementById("reviewer-name").value =
          myReview.author.startsWith("Anonymous Traveler")
            ? ""
            : myReview.author;
        document.getElementById("review-type").value =
          myReview.reviewType || "General Feedback";

        const utilityWrapper = document.getElementById(
          "utility-conditional-wrapper",
        );
        if (myReview.reviewType === "Utilities") {
          utilityWrapper.classList.remove("utility-wrapper-hidden");
          document.getElementById("utility-name").value =
            myReview.specificUtility || "CODM PTB Download Links";
        } else {
          utilityWrapper.classList.add("utility-wrapper-hidden");
        }

        document.getElementById("review-rating").value = myReview.rating || 5;
        document.getElementById("review-comment").value =
          myReview.comment || "";

        const termsBox = document.getElementById("review-terms-checkbox");
        if (termsBox) termsBox.checked = true;

        const submitBtn = document.getElementById("submit-review-btn");
        if (submitBtn) submitBtn.textContent = "Update Review";

        formCard.scrollIntoView({ behavior: "smooth" });
      });
  } else {
    // Show form card if this device hasn't reviewed yet
    formCard.style.display = "flex";
    panelContainer.innerHTML = "";
    panelContainer.style.display = "none";
    isEditingMode = false;
    editingDocId = null;
  }
}

// Compute & Render Play Store Analytics Summary Card
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

// Render Filtered Feed Cards
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
      ? ` <span class="your-review-pill">YOUR REVIEW</span>`
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

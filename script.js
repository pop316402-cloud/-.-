// ========== البيانات الافتراضية ==========
// تم إزالة TEACHER_PASSWORD نهائياً

// تحميل البيانات من localStorage
let users = JSON.parse(localStorage.getItem("platform_users")) || [];
let files = JSON.parse(localStorage.getItem("platform_files")) || [];
let exams = JSON.parse(localStorage.getItem("platform_exams")) || [];

let currentUser = null;

// ========== عناصر DOM ==========
const loginPage = document.getElementById("loginPage");
const dashboardPage = document.getElementById("dashboardPage");
const loginForm = document.getElementById("loginForm");
const loginName = document.getElementById("loginName");
const tabBtns = document.querySelectorAll(".tab-btn");
const userNameEl = document.getElementById("userName");
const userBadge = document.getElementById("userBadge");
const logoutBtn = document.getElementById("logoutBtn");
const teacherPanel = document.getElementById("teacherPanel");
const studentPanel = document.getElementById("studentPanel");
const uploadForm = document.getElementById("uploadForm");
const examForm = document.getElementById("examForm");
const filesList = document.getElementById("filesList");
const examsList = document.getElementById("examsList");
const studentFilesList = document.getElementById("studentFilesList");
const studentExamsList = document.getElementById("studentExamsList");
const toast = document.getElementById("toast");

let selectedRole = "student"; // الدور المحدد حالياً

// ========== التبويبات ==========
tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        tabBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedRole = btn.dataset.role;
    });
});

// ========== رسالة التنبيه ==========
function showToast(message, type = "info") {
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

// ========== تسجيل الدخول (بدون كلمة مرور) ==========
loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = loginName.value.trim();

    if (!name) {
        showToast("يرجى إدخال الاسم", "error");
        return;
    }

    // الدخول كمعلم
    if (selectedRole === "teacher") {
        currentUser = { name, role: "teacher" };
        loginUser();
        return;
    }

    // الدخول كطالب (بحث عن الحساب أو إنشاؤه)
    let existingUser = users.find(u => u.name === name && u.role === "student");

    if (existingUser) {
        currentUser = existingUser;
    } else {
        currentUser = { name, role: "student" };
        users.push(currentUser);
        localStorage.setItem("platform_users", JSON.stringify(users));
        showToast("تم إنشاء حسابك بنجاح 🎉", "success");
    }

    loginUser();
});

// ========== بعد تسجيل الدخول ==========
function loginUser() {
    loginPage.classList.remove("active");
    dashboardPage.classList.add("active");

    userNameEl.textContent = currentUser.name;

    if (currentUser.role === "teacher") {
        userBadge.textContent = "👨‍🏫 معلم";
        userBadge.style.background = "#10b981";
        teacherPanel.classList.remove("hidden");
        studentPanel.classList.add("hidden");
        renderTeacherContent();
    } else {
        userBadge.textContent = "👨‍🎓 طالب";
        userBadge.style.background = "#4f46e5";
        studentPanel.classList.remove("hidden");
        teacherPanel.classList.add("hidden");
        renderStudentContent();
    }

    // إعادة تعيين الحقول
    loginForm.reset();
    selectedRole = "student";
    tabBtns.forEach(b => b.classList.remove("active"));
    tabBtns[0].classList.add("active");
}

// ========== تسجيل الخروج ==========
logoutBtn.addEventListener("click", () => {
    currentUser = null;
    dashboardPage.classList.remove("active");
    loginPage.classList.add("active");
    showToast("تم تسجيل الخروج", "info");
});

// ========== رفع ملف (المعلم) ==========
uploadForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = document.getElementById("fileTitle").value.trim();
    const desc = document.getElementById("fileDesc").value.trim();
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];

    if (!file) {
        showToast("يرجى اختيار ملف", "error");
        return;
    }

    // حد أقصى 5 ميجا للـ localStorage
    if (file.size > 5 * 1024 * 1024) {
        showToast("حجم الملف كبير جداً (الحد 5 ميجا)", "error");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        const fileData = {
            id: Date.now(),
            title,
            desc,
            name: file.name,
            type: file.type,
            data: event.target.result,
            uploadedBy: currentUser.name,
            date: new Date().toLocaleDateString("ar-EG")
        };

        files.push(fileData);
        localStorage.setItem("platform_files", JSON.stringify(files));
        showToast("تم رفع الملف بنجاح ✅", "success");
        uploadForm.reset();
        renderTeacherContent();
    };

    reader.readAsDataURL(file);
});

// ========== إضافة اختبار (المعلم) ==========
examForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = document.getElementById("examTitle").value.trim();
    const link = document.getElementById("examLink").value.trim();

    if (!title || !link) {
        showToast("يرجى ملء جميع الحقول", "error");
        return;
    }

    const exam = {
        id: Date.now(),
        title,
        link,
        createdBy: currentUser.name,
        date: new Date().toLocaleDateString("ar-EG")
    };

    exams.push(exam);
    localStorage.setItem("platform_exams", JSON.stringify(exams));
    showToast("تم إضافة الاختبار بنجاح ✅", "success");
    examForm.reset();
    renderTeacherContent();
});

// ========== عرض محتوى المعلم ==========
function renderTeacherContent() {
    // الملفات
    filesList.innerHTML = files.length === 0
        ? '<div class="empty-msg">لا توجد ملفات مرفوعة بعد</div>'
        : files.map(f => `
            <div class="item">
                <div class="item-info">
                    <div class="item-title">${f.title}</div>
                    <div class="item-desc">${f.desc} — ${f.name}</div>
                </div>
                <div class="item-actions">
                    <a class="item-link" href="${f.data}" download="${f.name}">تحميل</a>
                    <button class="btn btn-delete" onclick="deleteFile(${f.id})">حذف</button>
                </div>
            </div>
        `).join("");

    // الاختبارات
    examsList.innerHTML = exams.length === 0
        ? '<div class="empty-msg">لا توجد اختبارات مضافة بعد</div>'
        : exams.map(ex => `
            <div class="item">
                <div class="item-info">
                    <div class="item-title">${ex.title}</div>
                    <div class="item-desc">${ex.date}</div>
                </div>
                <div class="item-actions">
                    <a class="item-link" href="${ex.link}" target="_blank">فتح</a>
                    <button class="btn btn-delete" onclick="deleteExam(${ex.id})">حذف</button>
                </div>
            </div>
        `).join("");
}

// ========== عرض محتوى الطالب ==========
function renderStudentContent() {
    studentFilesList.innerHTML = files.length === 0
        ? '<div class="empty-msg">لا توجد ملفات متاحة حالياً</div>'
        : files.map(f => `
            <div class="item">
                <div class="item-info">
                    <div class="item-title">${f.title}</div>
                    <div class="item-desc">${f.desc}</div>
                </div>
                <div class="item-actions">
                    <a class="item-link" href="${f.data}" download="${f.name}">تحميل</a>
                </div>
            </div>
        `).join("");

    studentExamsList.innerHTML = exams.length === 0
        ? '<div class="empty-msg">لا توجد اختبارات متاحة حالياً</div>'
        : exams.map(ex => `
            <div class="item">
                <div class="item-info">
                    <div class="item-title">${ex.title}</div>
                    <div class="item-desc">${ex.date}</div>
                </div>
                <div class="item-actions">
                    <a class="item-link" href="${ex.link}" target="_blank">ابدأ</a>
                </div>
            </div>
        `).join("");
}

// ========== حذف ملف ==========
window.deleteFile = function (id) {
    if (!confirm("هل تريد حذف هذا الملف؟")) return;
    files = files.filter(f => f.id !== id);
    localStorage.setItem("platform_files", JSON.stringify(files));
    showToast("تم حذف الملف", "info");
    renderTeacherContent();
};

// ========== حذف اختبار ==========
window.deleteExam = function (id) {
    if (!confirm("هل تريد حذف هذا الاختبار؟")) return;
    exams = exams.filter(e => e.id !== id);
    localStorage.setItem("platform_exams", JSON.stringify(exams));
    showToast("تم حذف الاختبار", "info");
    renderTeacherContent();
};
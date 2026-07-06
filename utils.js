/**
 * js/utils.js - Các hàm tiện ích dùng chung
 */

// Hàm 1: Định dạng chữ trạng thái (Nhận boolean, trả về string)
// Yêu cầu kỹ thuật: Tự định nghĩa hàm có tham số và giá trị trả về bằng JS thuần
function formatStatusText(isTaken) {
    if (isTaken === true) {
        return "Đã uống ✅";
    } else {
        return "Chưa uống ⏳";
    }
}

// Hàm 2: Trả về class Bootstrap phù hợp cho liều dùng thuốc (Nhận number, trả về string)
// Yêu cầu kỹ thuật: Tự định nghĩa hàm có tham số và giá trị trả về bằng JS thuần
function getDosageBadgeClass(dosage) {
    const d = Number(dosage);
    if (d <= 1) {
        return "bg-info text-white";
    } else if (d === 2) {
        return "bg-warning text-dark";
    } else {
        return "bg-danger text-white";
    }
}

// Hàm 3: Kiểm tra dữ liệu đầu vào của Lịch thuốc (Nhận object, trả về object chứa lỗi)
// Yêu cầu kỹ thuật: Tự định nghĩa hàm có tham số và giá trị trả về bằng JS thuần
function validateScheduleInput(data) {
    let errors = {};
    let isValid = true;

    // Kiểm tra tên bệnh nhân không được rỗng
    if (!data.patientName || data.patientName.trim() === "") {
        errors.patientName = "Tên bệnh nhân không được để trống!";
        isValid = false;
    }

    // Kiểm tra tên thuốc không được rỗng
    if (!data.medicationName || data.medicationName.trim() === "") {
        errors.medicationName = "Tên thuốc không được để trống!";
        isValid = false;
    }

    // Kiểm tra ngày uống không được rỗng
    if (!data.date || data.date.trim() === "") {
        errors.date = "Vui lòng chọn ngày uống!";
        isValid = false;
    }

    // Kiểm tra giờ uống không được rỗng
    if (!data.time || data.time.trim() === "") {
        errors.time = "Vui lòng chọn giờ uống!";
        isValid = false;
    }

    // Kiểm tra liều lượng phải lớn hơn 0
    if (!data.dosage || isNaN(data.dosage) || Number(data.dosage) <= 0) {
        errors.dosage = "Liều lượng phải là số lớn hơn 0!";
        isValid = false;
    }

    // Kiểm tra URL ảnh (nếu nhập thì phải đúng định dạng)
    if (data.image && data.image.trim() !== "") {
        const urlPattern = /^(http|https):\/\/[^ "]+$/;
        if (!urlPattern.test(data.image)) {
            errors.image = "Đường dẫn ảnh phải là URL hợp lệ (bắt đầu bằng http hoặc https)!";
            isValid = false;
        }
    }

    return {
        isValid: isValid,
        errors: errors
    };
}

// Hàm tiện ích 4: Hiển thị thông báo Toast Bootstrap 5 bằng jQuery
function showToast(message, type = "success") {
    const bgClass = type === "success" ? "bg-success" : type === "danger" ? "bg-danger" : "bg-warning";
    const textClass = type === "warning" ? "text-dark" : "text-white";

    const toastHtml = `
        <div class="toast align-items-center ${bgClass} ${textClass} border-0 shadow" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="3000">
            <div class="d-flex">
                <div class="toast-body fw-medium">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;

    // Thao tác DOM bằng jQuery (.append) và jQuery Selector
    let $container = $(".toast-container");
    if ($container.length === 0) {
        $("body").append('<div class="toast-container"></div>');
        $container = $(".toast-container");
    }

    const $toast = $(toastHtml);
    $container.append($toast);

    // Khởi tạo Bootstrap Toast
    const bsToast = new bootstrap.Toast($toast[0]);
    bsToast.show();

    // Tự động xóa khỏi DOM sau khi ẩn để tránh rác DOM
    $toast.on("hidden.bs.toast", function () {
        $(this).remove();
    });
}

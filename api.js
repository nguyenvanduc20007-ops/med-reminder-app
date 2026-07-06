/**
 * js/api.js - Tập trung tất cả hàm gọi MockAPI (Fetch & jQuery AJAX)
 */

// Định nghĩa API URL gốc (người dùng dễ dàng thay đổi)
const API_BASE = "https://6a38f81f64a2d8269223305f.mockapi.io";

const API_ENDPOINTS = {
    schedules: `${API_BASE}/schedules`,
    medications: `${API_BASE}/medications`,
    patients: `${API_BASE}/patients` // Nếu MockAPI có cấu hình resource bệnh nhân
};

// 1. Tải danh sách lịch uống thuốc (GET API dùng Fetch)
function getSchedules() {
    return fetch(API_ENDPOINTS.schedules)
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Không thể tải danh sách lịch uống thuốc từ máy chủ.");
            }
            return response.json();
        });
}

// 2. Thêm lịch uống thuốc mới (POST API dùng Fetch)
function addSchedule(scheduleData) {
    return fetch(API_ENDPOINTS.schedules, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(scheduleData)
    })
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Lỗi khi thêm lịch uống thuốc mới.");
            }
            return response.json();
        });
}

// 3. Cập nhật lịch uống thuốc (PUT API dùng Fetch)
function updateSchedule(id, scheduleData) {
    return fetch(`${API_ENDPOINTS.schedules}/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(scheduleData)
    })
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Lỗi khi cập nhật lịch uống thuốc.");
            }
            return response.json();
        });
}

// 4. Xóa lịch uống thuốc (DELETE API dùng jQuery AJAX)
// Yêu cầu kỹ thuật: Dùng jQuery AJAX ($.ajax() hoặc $.get()/$.post()) để gọi ít nhất 1 API
function deleteSchedule(id) {
    return new Promise(function (resolve, reject) {
        $.ajax({
            url: `${API_ENDPOINTS.schedules}/${id}`,
            type: "DELETE",
            success: function (result) {
                resolve(result);
            },
            error: function (xhr, status, error) {
                reject(new Error("Lỗi khi xóa lịch uống thuốc bằng jQuery AJAX."));
            }
        });
    });
}

// 5. Tải danh sách kho thuốc (GET API dùng Fetch)
function getMedications() {
    return fetch(API_ENDPOINTS.medications)
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Không thể tải danh sách kho thuốc.");
            }
            return response.json();
        });
}

// 6. Tải danh sách bệnh nhân (GET API dùng Fetch)
function getPatients() {
    return fetch(API_ENDPOINTS.patients)
        .then(function (response) {
            if (!response.ok) {
                // Fallback nếu MockAPI của sinh viên chưa tạo resource /patients
                throw new Error("Resource bệnh nhân không có sẵn.");
            }
            return response.json();
        });
}

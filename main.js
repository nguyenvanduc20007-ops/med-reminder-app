/**
 * js/main.js - Logic trang khách hàng (index.html)
 */

document.addEventListener("DOMContentLoaded", function () {
    // Đặt mặc định là ngày hôm nay
    const homNay = new Date().toISOString().split('T')[0];
    const ngayXemInput = document.getElementById("ngayXem");
    const searchInput = document.getElementById("timKiem");

    if (ngayXemInput) {
        ngayXemInput.value = homNay;

        // Yêu cầu 1: Xử lý sự kiện DOM bằng JS thuần (change)
        ngayXemInput.addEventListener("change", function () {
            taiVaHienThiLichThuoc();
        });
    }

    if (searchInput) {
        // Yêu cầu 1: Xử lý sự kiện DOM bằng JS thuần (input)
        searchInput.addEventListener("input", function () {
            taiVaHienThiLichThuoc();
        });
    }

    // Chạy tải dữ liệu lần đầu
    taiVaHienThiLichThuoc();
});

// Hàm chính tải và hiển thị dữ liệu lịch uống thuốc
function taiVaHienThiLichThuoc() {
    const ngayXem = document.getElementById("ngayXem").value;
    const tuKhoa = document.getElementById("timKiem") ? document.getElementById("timKiem").value.toLowerCase().trim() : "";

    // Hiển thị trạng thái loading (Skeleton) bằng jQuery
    $("#loading").show();
    $("#danhSach").hide();

    // Gọi API từ js/api.js bằng Fetch kết hợp Promise (.then/.catch)
    getSchedules()
        .then(function (data) {
            $("#loading").hide();

            let html = "";
            let coDuLieu = false;

            // Yêu cầu 1: Sử dụng cấu trúc điều khiển vòng lặp for cơ bản
            for (let i = 0; i < data.length; i++) {
                let item = data[i];

                // Lọc theo ngày được chọn
                const khopNgay = (item.date === ngayXem);

                // Lọc theo từ khóa tìm kiếm (tên bệnh nhân hoặc tên thuốc)
                const khopTuKhoa = tuKhoa === "" ||
                    (item.patientName && item.patientName.toLowerCase().includes(tuKhoa)) ||
                    (item.medicationName && item.medicationName.toLowerCase().includes(tuKhoa));

                if (khopNgay && khopTuKhoa) {
                    coDuLieu = true;

                    // Sử dụng các nút trạng thái cao cấp
                    const btnClass = item.isTaken ? "btn-status-taken" : "btn-status-pending";
                    const statusText = formatStatusText(item.isTaken);

                    // Sử dụng Hàm tự định nghĩa getDosageBadgeClass từ js/utils.js
                    const badgeClass = getDosageBadgeClass(item.dosage);

                    // Ảnh sản phẩm/thuốc mặc định nếu không có link ảnh
                    const hinhAnh = (item.image && item.image.trim() !== "") ? item.image : "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60";

                    // Thao tác DOM: xây dựng HTML cho card
                    html += `
                        <div class="col-12 col-md-6 col-lg-4 mb-4">
                            <div class="card med-card shadow-sm">
                                <div class="med-card-img-wrapper">
                                    <img src="${hinhAnh}" alt="${item.medicationName}" onerror="this.src='https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60'">
                                    <span class="position-absolute top-0 end-0 m-3 badge ${badgeClass} badge-dosage-premium">
                                        Liều: ${item.dosage} viên
                                    </span>
                                </div>
                                <div class="med-card-body">
                                    <h5 class="med-card-title text-primary">${item.medicationName}</h5>
                                    
                                    <div class="med-info-item">
                                        <i class="bi bi-person text-secondary"></i>
                                        <span>Bệnh nhân: <b class="text-dark">${item.patientName}</b></span>
                                    </div>
                                    
                                    <div class="med-info-item mb-4">
                                        <i class="bi bi-clock text-danger"></i>
                                        <span>Giờ uống: <span class="badge bg-danger-subtle text-danger border border-danger-subtle ms-1">${item.time}</span></span>
                                    </div>
                                    
                                    <div class="mt-auto d-flex gap-2">
                                        <button class="btn ${btnClass} flex-grow-1 py-2" onclick="xuLyDoiTrangThai('${item.id}', ${item.isTaken})">
                                            ${statusText}
                                        </button>
                                        <button class="btn btn-light border py-2 px-3" onclick="moModalChiTiet('${item.id}')" title="Xem chi tiết">
                                            <i class="bi bi-info-circle"></i> Chi tiết
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }
            }

            if (coDuLieu === false) {
                html = `
                    <div class="col-12 text-center py-5">
                        <div class="text-muted mb-3"><i class="bi bi-clipboard-x fs-1"></i></div>
                        <h5 class="text-muted">Không có lịch uống thuốc nào được tìm thấy.</h5>
                        <p class="text-secondary small">Vui lòng thử chọn ngày khác hoặc thay đổi từ khóa tìm kiếm.</p>
                    </div>
                `;
            }

            // Yêu cầu 1: Thao tác DOM bằng JS thuần (innerHTML)
            document.getElementById("danhSach").innerHTML = html;

            // Áp dụng hiệu ứng jQuery (.fadeIn) khi hiển thị danh sách
            $("#danhSach").fadeIn(500);
        })
        .catch(function (error) {
            $("#loading").hide();
            // Xử lý lỗi: Thông báo lỗi khi gọi API thất bại bằng hàm showToast từ js/utils.js
            showToast(error.message || "Không thể kết nối tới máy chủ. Vui lòng kiểm tra lại!", "danger");

            document.getElementById("danhSach").innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="text-danger mb-3"><i class="bi bi-exclamation-triangle-fill fs-1"></i></div>
                    <h5 class="text-danger">Đã xảy ra lỗi khi tải dữ liệu!</h5>
                    <p class="text-secondary small">${error.message}</p>
                    <button class="btn btn-primary btn-sm mt-3" onclick="taiVaHienThiLichThuoc()">Tải lại dữ liệu</button>
                </div>
            `;
            $("#danhSach").show();
        });
}

// Xử lý chuyển đổi trạng thái đã uống / chưa uống (PUT API)
function xuLyDoiTrangThai(id, trangThaiHienTai) {
    const trangThaiMoi = !trangThaiHienTai;

    // Tìm phần tử nút bấm hiện tại và hiển thị spinner tạm thời
    showToast("Đang cập nhật trạng thái...", "warning");

    updateSchedule(id, { isTaken: trangThaiMoi })
        .then(function () {
            showToast("Đã cập nhật trạng thái thành công!", "success");
            taiVaHienThiLichThuoc(); // Tải lại danh sách
        })
        .catch(function (error) {
            showToast("Cập nhật thất bại: " + error.message, "danger");
        });
}

// Mở modal hiển thị chi tiết lịch thuốc bằng jQuery và Bootstrap 5
function moModalChiTiet(id) {
    getSchedules()
        .then(function (data) {
            // Yêu cầu 1: Dùng for tìm kiếm sản phẩm theo id
            let schedule = null;
            for (let i = 0; i < data.length; i++) {
                if (data[i].id == id) {
                    schedule = data[i];
                    break;
                }
            }

            if (schedule) {
                const statusText = formatStatusText(schedule.isTaken);
                const hinhAnh = (schedule.image && schedule.image.trim() !== "") ? schedule.image : "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60";

                // Cập nhật thông tin vào Modal bằng jQuery (.html, .attr)
                $("#modalTitle").html(`<i class="bi bi-prescription2 text-primary"></i> ${schedule.medicationName}`);
                $("#modalDetailImg").attr("src", hinhAnh);
                $("#modalPatientName").text(schedule.patientName);
                $("#modalDosage").text(`${schedule.dosage} viên`);
                $("#modalTime").text(schedule.time);
                $("#modalDate").text(schedule.date);
                $("#modalStatus").text(statusText);
                $("#modalNote").text(schedule.description || "Không có ghi chú nào khác.");

                // Hiển thị modal bằng Bootstrap API
                const chiTietModal = new bootstrap.Modal(document.getElementById('modalChiTiet'));
                chiTietModal.show();
            }
        })
        .catch(function (error) {
            showToast("Không thể tải thông tin chi tiết: " + error.message, "danger");
        });
}

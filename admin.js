/**
 * js/admin.js - Logic trang quản trị (admin.html)
 */

let idSua = null;
let currentDeleteId = null;
let deleteModalInstance = null;

// Biến lưu trữ dữ liệu để phân trang
let schedulesData = [];
let currentPage = 1;
const itemsPerPage = 6;

document.addEventListener("DOMContentLoaded", function () {
    // Đặt mặc định ngày uống là ngày hôm nay cho form nhập
    const ngayNhapInput = document.getElementById("nhapNgay");
    if (ngayNhapInput) {
        const homNay = new Date().toISOString().split('T')[0];
        ngayNhapInput.value = homNay;
    }

    // Tải và hiển thị dữ liệu quản trị
    taiDuLieuAdmin();

    // Yêu cầu 1: Bắt sự kiện submit form bằng JS thuần
    const formNhap = document.getElementById("formNhap");
    if (formNhap) {
        formNhap.addEventListener("submit", function (e) {
            e.preventDefault(); // Chặn hành vi submit mặc định
            xuLyLuuLichThuoc();
        });
    }

    // Khởi tạo modal xác nhận xóa
    const deleteModalEl = document.getElementById("modalXacNhanXoa");
    if (deleteModalEl) {
        deleteModalInstance = new bootstrap.Modal(deleteModalEl);
    }

    // Sự kiện click nút xác nhận xóa trên Modal (Sử dụng jQuery .on)
    $(document).on("click", "#btnDongYXoa", function () {
        if (currentDeleteId) {
            thucHienXoaLichThuoc(currentDeleteId);
        }
    });

    // Rà soát lỗi realtime khi người dùng nhập dữ liệu (Yêu cầu sự kiện input JS thuần)
    const inputsToCheck = ["nhapBenhNhan", "nhapThuoc", "nhapNgay", "nhapGio", "nhapLieu", "nhapAnh"];
    for (let i = 0; i < inputsToCheck.length; i++) {
        let inputEl = document.getElementById(inputsToCheck[i]);
        if (inputEl) {
            inputEl.addEventListener("input", function () {
                // Khi người dùng đang gõ, ẩn bớt lỗi cụ thể của trường đó
                const errId = "loi" + inputsToCheck[i].replace("nhap", "");
                $(`#${errId}`).slideUp();
            });
        }
    }
});

// Tải dữ liệu toàn bộ và hiển thị trang Admin
function taiDuLieuAdmin() {
    $("#bangLich").html('<tr><td colspan="5" class="text-center py-4"><div class="spinner-border text-primary spinner-border-sm"></div> Đang tải lịch thuốc...</td></tr>');

    // Tải API Lịch Uống (GET Fetch)
    getSchedules()
        .then(function (data) {
            schedulesData = data;
            // Sắp xếp lịch thuốc mới nhất lên trên
            schedulesData.reverse();
            hienThiBangLichThuoc();
            hienThiDanhSachBenhNhan(data);
        })
        .catch(function (error) {
            showToast("Lỗi tải lịch uống: " + error.message, "danger");
        });

    // Tải API Kho Thuốc (GET Fetch)
    $("#dsKhoThuoc").html('<li class="list-group-item text-center text-muted py-3"><div class="spinner-border text-success spinner-border-sm me-2"></div> Đang tải kho thuốc...</li>');
    getMedications()
        .then(function (data) {
            let htmlThuoc = "";
            for (let i = 0; i < data.length; i++) {
                htmlThuoc += `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <span class="fw-medium text-dark"><i class="bi bi-capsule text-success me-2"></i> ${data[i].name}</span>
                            <div class="small text-muted ps-4">Kho: ${data[i].stock || 0} viên</div>
                        </div>
                        <span class="badge bg-success-subtle text-success rounded-pill">${data[i].category}</span>
                    </li>`;
            }
            if (data.length === 0) {
                htmlThuoc = '<li class="list-group-item text-muted text-center py-3">Kho thuốc trống</li>';
            }
            document.getElementById("dsKhoThuoc").innerHTML = htmlThuoc;
        })
        .catch(function (error) {
            // Fallback nếu MockAPI chưa có dữ liệu medications
            document.getElementById("dsKhoThuoc").innerHTML = `
                <li class="list-group-item text-muted text-center py-3">
                    <span class="text-danger small">Không thể kết nối kho thuốc</span>
                </li>`;
        });
}

// Hiển thị bảng lịch thuốc có phân trang
function hienThiBangLichThuoc() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = schedulesData.slice(startIndex, endIndex);

    let html = "";
    for (let i = 0; i < paginatedItems.length; i++) {
        let item = paginatedItems[i];
        const statusText = item.isTaken ? "Đã uống ✅" : "Chưa uống ⏳";
        const statusBadge = item.isTaken ? "badge bg-success-subtle text-success border border-success-subtle" : "badge bg-warning-subtle text-warning border border-warning-subtle";
        const hinhAnh = (item.image && item.image.trim() !== "") ? item.image : "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&auto=format&fit=crop&q=60";

        html += `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${hinhAnh}" class="rounded-3 me-3 border" style="width: 52px; height: 52px; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&auto=format&fit=crop&q=60'">
                        <div>
                            <div class="fw-bold text-dark fs-6">${item.patientName}</div>
                            <small class="text-muted"><i class="bi bi-calendar3 text-primary-light"></i> ${item.date}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="text-primary fw-bold">${item.medicationName}</span>
                    <div class="small text-muted">Liều: ${item.dosage} viên</div>
                </td>
                <td>
                    <span class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">${item.time}</span>
                </td>
                <td>
                    <span class="${statusBadge} px-2 py-1">${statusText}</span>
                </td>
                <td>
                    <div class="d-flex gap-2 justify-content-end">
                        <button class="btn btn-sm btn-light border nut-sua" 
                            data-id="${item.id}" 
                            data-bn="${item.patientName}" 
                            data-thuoc="${item.medicationName}" 
                            data-ngay="${item.date}" 
                            data-gio="${item.time}" 
                            data-lieu="${item.dosage}" 
                            data-anh="${item.image}"
                            title="Sửa lịch">
                            <i class="bi bi-pencil text-warning"></i>
                        </button>
                        <button class="btn btn-sm btn-light border nut-xoa" 
                            data-id="${item.id}"
                            data-thuoc="${item.medicationName}"
                            data-bn="${item.patientName}"
                            title="Xóa lịch">
                            <i class="bi bi-trash text-danger"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
    }

    if (schedulesData.length === 0) {
        html = '<tr><td colspan="5" class="text-center py-5 text-muted">Không có lịch uống thuốc nào.</td></tr>';
    }

    document.getElementById("bangLich").innerHTML = html;
    hienThiPhanTrang();
}

// Vẽ bộ phân trang Pagination của Bootstrap 5
function hienThiPhanTrang() {
    const totalPages = Math.ceil(schedulesData.length / itemsPerPage);
    let pagHtml = "";

    if (totalPages > 1) {
        // Nút Trước
        pagHtml += `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="chuyenTrang(${currentPage - 1}); return false;">Trước</a>
            </li>`;

        // Các số trang
        for (let i = 1; i <= totalPages; i++) {
            pagHtml += `
                <li class="page-item ${currentPage === i ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="chuyenTrang(${i}); return false;">${i}</a>
                </li>`;
        }

        // Nút Tiếp theo
        pagHtml += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="chuyenTrang(${currentPage + 1}); return false;">Tiếp</a>
            </li>`;
    }

    $("#phanTrang").html(pagHtml);
}

// Chuyển đổi trang dữ liệu
function chuyenTrang(page) {
    currentPage = page;
    hienThiBangLichThuoc();
}

// Tổng hợp và in danh sách bệnh nhân ra màn hình
function hienThiDanhSachBenhNhan(data) {
    let mangBN = [];
    for (let i = 0; i < data.length; i++) {
        let item = data[i];
        if (item.patientName && item.patientName.trim() !== "" && !mangBN.includes(item.patientName)) {
            mangBN.push(item.patientName);
        }
    }

    let htmlBN = "";
    for (let j = 0; j < mangBN.length; j++) {
        htmlBN += `
            <li class="list-group-item d-flex align-items-center">
                <div class="avatar bg-primary text-white rounded-circle me-3 d-flex align-items-center justify-content-center" style="width: 32px; height: 32px; font-size: 0.85rem; font-weight: 600;">
                    ${mangBN[j].charAt(0).toUpperCase()}
                </div>
                <span class="fw-medium text-dark">${mangBN[j]}</span>
            </li>`;
    }

    if (mangBN.length === 0) {
        htmlBN = '<li class="list-group-item text-muted text-center py-3">Chưa có bệnh nhân nào</li>';
    }
    document.getElementById("dsBenhNhan").innerHTML = htmlBN;
}

// Xử lý thêm mới hoặc cập nhật lịch uống thuốc (Có Validation)
function xuLyLuuLichThuoc() {
    const bn = document.getElementById("nhapBenhNhan").value;
    const thuoc = document.getElementById("nhapThuoc").value;
    const ngay = document.getElementById("nhapNgay").value;
    const gio = document.getElementById("nhapGio").value;
    const lieu = document.getElementById("nhapLieu").value;
    const anh = document.getElementById("nhapAnh").value;

    const duLieuForm = {
        patientName: bn,
        medicationName: thuoc,
        date: ngay,
        time: gio,
        dosage: lieu === "" ? "" : Number(lieu),
        image: anh
    };

    // Ẩn tất cả thông báo lỗi cũ đi trước khi kiểm tra mới (Sử dụng hiệu ứng jQuery .slideUp)
    $(".text-danger").slideUp();

    // Sử dụng hàm tự định nghĩa validateScheduleInput trong js/utils.js
    const valResult = validateScheduleInput(duLieuForm);

    if (valResult.isValid === false) {
        // Yêu cầu 3: Hiển thị lỗi inline rõ ràng ngay bên dưới từng trường
        // Sử dụng hiệu ứng jQuery (.slideDown) để hiện thị lỗi mượt mà
        if (valResult.errors.patientName) { $("#loiBenhNhan").text(valResult.errors.patientName).slideDown(); }
        if (valResult.errors.medicationName) { $("#loiThuoc").text(valResult.errors.medicationName).slideDown(); }
        if (valResult.errors.date) { $("#loiNgay").text(valResult.errors.date).slideDown(); }
        if (valResult.errors.time) { $("#loiGio").text(valResult.errors.time).slideDown(); }
        if (valResult.errors.dosage) { $("#loiLieu").text(valResult.errors.dosage).slideDown(); }
        if (valResult.errors.image) { $("#loiAnh").text(valResult.errors.image).slideDown(); }

        showToast("Thông tin nhập vào không hợp lệ. Vui lòng kiểm tra lại!", "danger");
        return; // Ngăn chặn lưu nếu có lỗi
    }

    // Chuẩn bị payload để lưu
    const duLieuLuu = {
        patientName: bn.trim(),
        medicationName: thuoc.trim(),
        date: ngay,
        time: gio,
        dosage: Number(lieu),
        image: anh.trim(),
        isTaken: idSua !== null ? undefined : false // Nếu thêm mới thì mặc định chưa uống
    };

    let apiCall;
    if (idSua !== null) {
        // Gọi PUT API để cập nhật dữ liệu từ js/api.js
        apiCall = updateSchedule(idSua, duLieuLuu);
    } else {
        // Gọi POST API để thêm mới dữ liệu từ js/api.js
        apiCall = addSchedule(duLieuLuu);
    }

    showToast("Đang gửi yêu cầu tới máy chủ...", "warning");

    apiCall
        .then(function () {
            showToast("Lưu thông tin lịch uống thuốc thành công!", "success");

            // Reset form sau khi lưu thành công (Yêu cầu 3)
            document.getElementById("formNhap").reset();

            // Trả nút bấm về trạng thái cũ
            document.getElementById("btnLuu").innerText = "Lưu Lịch Thuốc";
            $("#btnHuySua").hide(); // Ẩn nút hủy sửa bằng jQuery
            idSua = null;

            // Đặt lại mặc định ngày uống là hôm nay
            const homNay = new Date().toISOString().split('T')[0];
            document.getElementById("nhapNgay").value = homNay;

            // Tải lại dữ liệu trang Admin
            taiDuLieuAdmin();
        })
        .catch(function (error) {
            showToast("Lưu thất bại: " + error.message, "danger");
        });
}

// Bắt sự kiện click nút Sửa trên bảng (Sử dụng jQuery .on)
$(document).on("click", ".nut-sua", function () {
    idSua = $(this).attr("data-id");

    // Đổ ngược dữ liệu vào form bằng jQuery .val()
    $("#nhapBenhNhan").val($(this).attr("data-bn"));
    $("#nhapThuoc").val($(this).attr("data-thuoc"));
    $("#nhapNgay").val($(this).attr("data-ngay"));
    $("#nhapGio").val($(this).attr("data-gio"));
    $("#nhapLieu").val($(this).attr("data-lieu"));
    $("#nhapAnh").val($(this).attr("data-anh"));

    // Đổi chữ nút Lưu thành Cập nhật
    $("#btnLuu").text("Cập nhật lịch");

    // Hiện nút Hủy sửa
    $("#btnHuySua").show();

    // Cuộn trang lên form nhập mượt mà bằng jQuery
    $('html, body').animate({
        scrollTop: $("#formNhap").offset().top - 100
    }, 400);
});

// Bắt sự kiện hủy sửa (Sử dụng jQuery .on)
$(document).on("click", "#btnHuySua", function () {
    document.getElementById("formNhap").reset();
    const homNay = new Date().toISOString().split('T')[0];
    document.getElementById("nhapNgay").value = homNay;

    $("#btnLuu").text("Lưu Lịch Thuốc");
    $("#btnHuySua").hide();
    $(".text-danger").slideUp();
    idSua = null;
    showToast("Đã hủy bỏ thao tác chỉnh sửa.");
});

// Bắt sự kiện click nút Xóa trên bảng để mở Modal Xác Nhận Xóa (Sử dụng jQuery .on)
$(document).on("click", ".nut-xoa", function () {
    currentDeleteId = $(this).attr("data-id");
    const tenThuoc = $(this).attr("data-thuoc");
    const tenBN = $(this).attr("data-bn");

    // Cập nhật câu hỏi xác nhận vào Modal
    $("#modalXoaNoiDung").html(`Bạn có chắc chắn muốn xóa lịch uống thuốc <b>${tenThuoc}</b> của bệnh nhân <b>${tenBN}</b> không? Hành động này không thể hoàn tác.`);

    // Mở modal xác nhận
    if (deleteModalInstance) {
        deleteModalInstance.show();
    }
});

// Thực hiện xóa lịch uống thuốc (Sử dụng API deleteSchedule dùng $.ajax trong js/api.js)
function thucHienXoaLichThuoc(id) {
    if (deleteModalInstance) {
        deleteModalInstance.hide();
    }

    showToast("Đang xóa lịch uống thuốc...", "warning");

    deleteSchedule(id)
        .then(function () {
            showToast("Đã xóa lịch uống thuốc thành công!", "success");
            currentDeleteId = null;
            // Tải lại dữ liệu
            taiDuLieuAdmin();
        })
        .catch(function (error) {
            showToast("Xóa thất bại: " + error.message, "danger");
        });
}

// Bắt sự kiện click nút Tạo Dữ Liệu Mẫu
$(document).on("click", "#btnSeedData", function () {
    const $btn = $(this);
    const originalText = $btn.html();
    $btn.prop("disabled", true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang tạo...');

    // Danh sách mẫu (Thuốc thông dụng hàng ngày tại Việt Nam)
    const sampleSchedules = [
        {
            patientName: "Nguyễn Văn An",
            medicationName: "Panadol Extra",
            date: new Date().toISOString().split('T')[0],
            time: "08:00",
            dosage: 1,
            image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60",
            isTaken: false,
            description: "Thuốc giảm đau hạ sốt. Uống sau khi ăn sáng. Nhắc nhở người bệnh uống thêm nước ấm."
        },
        {
            patientName: "Trần Thị Bình",
            medicationName: "Decolgen Forte",
            date: new Date().toISOString().split('T')[0],
            time: "12:30",
            dosage: 1,
            image: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=500&auto=format&fit=crop&q=60",
            isTaken: true,
            description: "Thuốc trị cảm cúm, sổ mũi. Uống sau ăn trưa. Lưu ý: Thuốc có thể gây buồn ngủ nhẹ."
        },
        {
            patientName: "Lê Hoàng Nam",
            medicationName: "Vitamin C Enervon",
            date: new Date().toISOString().split('T')[0],
            time: "09:00",
            dosage: 1,
            image: "https://images.unsplash.com/photo-1616679911721-eff6eec18fcd?w=500&auto=format&fit=crop&q=60",
            isTaken: false,
            description: "Bổ sung vitamin, tăng cường đề kháng. Uống vào buổi sáng sau khi ăn no, không uống lúc đói hoặc tối muộn."
        },
        {
            patientName: "Trần Thị Bình",
            medicationName: "Berberin 100mg",
            date: new Date().toISOString().split('T')[0],
            time: "19:00",
            dosage: 3,
            image: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&auto=format&fit=crop&q=60",
            isTaken: false,
            description: "Thuốc hỗ trợ đường ruột, trị đau bụng tiêu chảy. Uống với nhiều nước ấm sau bữa ăn tối."
        }
    ];

    const sampleMeds = [
        { name: "Panadol Extra", category: "Giảm đau hạ sốt", stock: 120 },
        { name: "Decolgen Forte", category: "Trị cảm cúm", stock: 50 },
        { name: "Vitamin C Enervon", category: "Tăng đề kháng", stock: 200 },
        { name: "Berberin 100mg", category: "Hỗ trợ tiêu hóa", stock: 150 },
        { name: "Strepsils Cool", category: "Giảm ho đau họng", stock: 300 }
    ];

    // Hàm seed lần lượt bằng Fetch
    const promises = [];

    // Thêm thuốc
    for (let i = 0; i < sampleMeds.length; i++) {
        promises.push(
            fetch(`${API_BASE}/medications`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(sampleMeds[i])
            })
        );
    }

    // Thêm lịch trình
    for (let j = 0; j < sampleSchedules.length; j++) {
        promises.push(
            fetch(`${API_BASE}/schedules`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(sampleSchedules[j])
            })
        );
    }

    Promise.all(promises)
        .then(function () {
            $btn.prop("disabled", false).html(originalText);
            taiDuLieuAdmin();
        })
        .catch(function (error) {
            $btn.prop("disabled", false).html(originalText);
        });
});

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageItem",
    "sap/m/MessageView",
    "sap/m/MessageBox",
    'sap/ui/core/library',
    'sap/m/Dialog',
    'sap/m/Button',
    'sap/m/Bar',
    'sap/m/Title',
    'sap/ui/core/IconPool',
    "sap/m/MessageToast"
],
    function (Controller, Fragment, JSONModel, MessageItem, MessageView, MessageBox, coreLibrary, Dialog, Button, Bar, Title, IconPool, MessageToast) {
        "use strict";
        return {
            inputAmountDialog: null,
            inputHeaderDialog: null,
            busyDialog: null,
            deNghiData: null,
            onInitSmartFilterBarExtension: function (oEvent) {
                let filterObject = this.getView().byId('listReportFilter')
                let defaultValue = {
                    gjahr: new Date().getFullYear().toString(),
                    companycode: '1000'
                }
                filterObject.setFilterData(defaultValue)
            },
            openBusyDialog: function () {
                if (!this.busyDialog) {
                    Fragment.load({
                        id: "idBusyDialog",
                        name: "zdenghilog.ext.fragment.Busy",
                        type: "XML",
                        controller: this
                    })
                        .then((oDialog) => {
                            this.busyDialog = oDialog;
                            this.busyDialog.open()
                        })
                        .catch((error) => {
                            MessageBox.error('Vui lòng tải lại trang')
                        });
                } else {
                    this.busyDialog.open()
                }
            },
            onActionDeleteDeNghi: function (oEvent) {
                //var oUser = sap.ui2.shell.getUser();
                this.openBusyDialog()
                var thatController = this
                let oSelectedContextCheck = this.extensionAPI.getSelectedContexts();
                oSelectedContextCheck.forEach(element => {
                    let oModelDeNghi = element.getModel()
                    let readDeNghi = new Promise((resolve, reject) => {
                        oModelDeNghi.read(element.getPath(), {
                            success: function (oData, oResponse) {
                                resolve(oData)
                            },
                            error: function (error) {
                                reject(error)
                            }
                        })
                    })
                    readDeNghi.
                        then((data) => {
                            if(data.is_del == ''){
                            let thatController = this
                            MessageBox.warning("Xác nhận huỷ chứng từ?", {
                                actions: ['Yes', 'No'],
                                emphasizedAction: 'Yes',
                                onClose: function (sAction) {
                                    let user = sap.ushell.Container.getService("UserInfo").getUser().getId()
                                    if (sAction == 'Yes') {
                                        let oSelectedContext = thatController.extensionAPI.getSelectedContexts();
                                        oSelectedContext.forEach(element => {
                                            let url = element.getPath()
                                            const date = new Date();
                                            let updateData = {
                                                is_del: 'X',
                                                del_user: user,
                                                del_date: date
                                            }
                                            let oModelDeNghi = element.getModel()
                                            console.log(oModelDeNghi)
                                            oModelDeNghi.read(url, {
                                                success: function (oResponse) {
                                                    if (oResponse.pst_user && oResponse.pst_user == user) {
                                                        oModelDeNghi.update(url, updateData, {
                                                            success: function (oData, response) {
                                                                MessageToast.show('Huỷ thành công chứng từ')
                                                                thatController.busyDialog.close()
                                                                oModelDeNghi.refresh()
                                                            },
                                                            error: function (error) {
                                                                MessageBox.error('Huỷ không thành công')
                                                                thatController.busyDialog.close()
                                                            }
            
                                                        })
                                                    } else {
                                                        console.log(user)
                                                        MessageBox.error(`Chứng từ được tạo bởi user ${oResponse.pst_user}`)
                                                        thatController.busyDialog.close()
                                                    }
            
                                                }
                                            })
                                            // oModelDeNghi.update(url, updateData, {
                                            //     success: function (oData, response) {
                                            //         MessageToast.show('Huỷ thành công chứng từ')
                                            //         thatController.busyDialog.close()
                                            //         oModelDeNghi.refresh()
                                            //     },
                                            //     error: function (error) {
                                            //         MessageBox.error('Huỷ không thành công')
                                            //         thatController.busyDialog.close()
                                            //     }
            
                                            // })
                                        })
                                    }
                                }
                            })     }
                            else{
                                thatController.busyDialog.close()
                                MessageBox.error("Chứng từ đã được hủy")
                            }
                        })

                })
            

            },
            onPrintDeNghi: function (oEvent) {
                this.openBusyDialog()
                var thatController = this
                let oSelectedContext = this.extensionAPI.getSelectedContexts();
                oSelectedContext.forEach(element => {
                    let url = element.getPath()
                    let oModelDeNghi = element.getModel()
                    let readDeNghi = new Promise((resolve, reject) => {
                        oModelDeNghi.read(element.getPath(), {
                            success: function (oData, oResponse) {
                                resolve(oData)
                            },
                            error: function (error) {
                                reject(error)
                            }
                        })
                    })
                    readDeNghi.
                        then((data) => {
                            let template = ''
                            let report = ''
                            if (data.ctdenghi == 'A') {
                                template = 'DENGHI/DENGHI'
                                report = 'DENGHI'
                            } else if (data.ctdenghi == 'B') {
                                template = 'TAMUNG/TAMUNG'
                                report = 'TAMUNG'
                            } else if (data.ctdenghi == 'C') {
                                template = 'THANHTOANHOANUNG/THANHTOANHOANUNG'
                                report = 'TTHOANUNG'

                            }
                            var requestPDF = JSON.stringify({
                                "id": `${data.zdenghi}${data.gjahr}`,
                                "report": report,
                                "xdpTemplate": template
                            });
                            var urlPDF = "https://" + window.location.hostname + "/sap/bc/http/sap/z_api_adobe?=";
                            $.ajax({
                                url: urlPDF,
                                type: "POST",
                                contentType: "application/json",
                                data: requestPDF,
                                success: function (response, textStatus, jqXHR) {
                                    console.log(response)
                                    let data = JSON.parse(response)
                                    var decodedPdfContent = atob(data.fileContent)//base65 to string ?? to pdf
                                    console.log(decodedPdfContent)
                                    var byteArray = new Uint8Array(decodedPdfContent.length);
                                    for (var i = 0; i < decodedPdfContent.length; i++) {
                                        byteArray[i] = decodedPdfContent.charCodeAt(i);
                                    }
                                    var blob = new Blob([byteArray.buffer], {
                                        type: 'application/pdf'
                                    });
                                    console.log(blob)
                                    var _pdfurl = URL.createObjectURL(blob);
                                    console.log(_pdfurl)
                                    if (!this._PDFViewer) {
                                        this._PDFViewer = new sap.m.PDFViewer({
                                            width: "auto",
                                            source: _pdfurl
                                        });
                                        jQuery.sap.addUrlWhitelist("blob"); // register blob url as whitelist
                                    }
                                    thatController.busyDialog.close()
                                    this._PDFViewer.downloadPDF();
                                },
                                error: function (error) {
                                    thatController.busyDialog.close()
                                    MessageBox.error(JSON.stringify(error))
                                }
                            });
                        })
                        .catch((error) => {
                            thatController.busyDialog.close()
                            MessageBox.error(`Có lỗi xảy ra: ${error.message}`)
                        })
                })
            },
            onPrintDeNghiMoi: function (oEvent) {
                function getFormatDate(dateFormat, so) {
                    var date = dateFormat.getDate() < 10 ? `0${dateFormat.getDate()
                        }` : dateFormat.getDate();
                    var month = dateFormat.getMonth() + 1 < 10 ? `0${dateFormat.getMonth() + 1
                        }` : dateFormat.getMonth() + 1;
                    var year = dateFormat.getFullYear();
                    if (so == 1) {
                        var dateDone = `${date}/${month}/${year}`;
                        return dateDone;
                    }
                    else {
                        var dateDone = `Ngày ${date} tháng ${month} năm ${year}`;
                        return dateDone;
                    }

                }
                this.openBusyDialog()
                var thatController = this
                let oSelectedContext = this.extensionAPI.getSelectedContexts();
                oSelectedContext.forEach(element => {
                    let url = element.getPath()
                    let oModelDeNghi = element.getModel()
                    let readDeNghi = new Promise((resolve, reject) => {
                        oModelDeNghi.read(element.getPath(), {
                            success: function (oData, oResponse) {
                                resolve(oData)
                            },
                            error: function (error) {
                                reject(error)
                            }
                        })
                    })
                    readDeNghi.
                        then((data) => {
                            let template = ''
                            let report = ''
                            if (data.ctdenghi == 'A') {
                                console.log(data)
                                var header = `<Heading>
                                <companyCodeName>CÔNG TY CỔ PHẦN DƯỢC LIỆU TRUNG ƯƠNG 2</companyCodeName>
                                <companyCodeAdress>24 Nguyễn Thị Nghĩa, Phường Bến Thành, Quận 1</companyCodeAdress>
                                <Tel_Fax>
                                   <companyCodePhone>Tel: (08)38323058</companyCodePhone>
                                   <companyCodeFax>38323012</companyCodeFax>
                                </Tel_Fax>
                                <Email_Web>
                                   <companyCodeEmail>Email: info@phytopharma.vn</companyCodeEmail>
                                   <companyCodeWeb>Website: www.phytopharma.vn</companyCodeWeb>
                                </Email_Web>
                             </Heading>
                          </Subform1>
                          <kinhGui>
                             <title>GIẤY ĐỀ NGHỊ THANH TOÁN</title>
                             <So>${data.zdenghi}</So>
                          </kinhGui>
                          <HeaderInfo>
                             <ToiTen>${data.nguoidenghi}</ToiTen>
                             <DonViCongTac>${data.donvicongtac}</DonViCongTac>
                             <LyDoThanhToan>${data.lydothanhtoan}</LyDoThanhToan>
                          </HeaderInfo>`
                                const formatter = new Intl.NumberFormat('vi-VN', {
                                    currency: data.transactioncurrency,
                                });
                                var listItem = ''
                                oModelDeNghi.read(`${element.getPath()}/to_item`, {
                                    success: function (oData, oResponse) {
                                        console.log(oData)
                                        const d = new Date()
                                        var stt = 0
                                        var tong = 0
                                        oData.results.forEach(item => {
                                            stt++
                                            listItem += `<Data>
                                            <STT>${stt}</STT>
                                            <DocumentNumber>${item.accountingdocumenttype == 'RE' ? item.supplierinvoice : item.accountingdocument}</DocumentNumber>
                                            <SoHoaDon>${item.sohoadon}</SoHoaDon>
                                            <NgayHoaDon>${getFormatDate(item.ngayhoadon, 1)}</NgayHoaDon>
                                            <DienGiai>${item.diengiai}</DienGiai>
                                            <TriGia>${formatter.format(item.sotientruocthue)}</TriGia>
                                            <VAT>${item.vat}</VAT>
                                            <TongCong>${formatter.format(item.sotiendenghi)}</TongCong>
                                         </Data>`
                                            tong += Number(item.sotiendenghi)

                                        })
                                        console.log(tong)
                                        var spellAmount = JSON.stringify({ "amount": `${tong < 0 ? tong * -1 : tong}`, "waers": `${data.transactioncurrency}`, "lang": "VI" })

                                        var url_amountWords = "https://" + window.location.hostname + "/sap/bc/http/sap/zcore_api_amount_in_words";
                                        $.ajax({
                                            url: url_amountWords,
                                            type: "POST",
                                            contentType: "application/json",
                                            data: spellAmount,
                                            beforeSend: function (xhr) {
                                                xhr.setRequestHeader('Authorization', 'Basic UFRQOnhucEtmbkxUcFNwa2N2SEdiSnBVOXUmTmVXZ3hEYXhXWVBwTHV2Vnk=');
                                            },
                                            success: function (resp, textStatus, jqHXR) {
                                                var dataWord = JSON.parse(resp);
                                                var xml = `<?xml version="1.0" encoding="UTF-8"?>
                                                <form1>
                                                   <MAIN>
                                                      <Subform1>
                                                         ${header}
                                                      <DataSubForm>
                                                         <DataTable>
                                                            <HeaderRow/>
                                                           ${listItem}
                                                            <Sum>
                                                               <SumTongCong>${formatter.format(tong)}</SumTongCong>
                                                            </Sum>
                                                         </DataTable>
                                                      </DataSubForm>
                                                      <FooterInfomation>
                                                         <SoTienBangChu>${dataWord.Result}</SoTienBangChu>
                                                         <ChungTuKemTheo>${data.ctkemtheo}</ChungTuKemTheo>
                                                         <HinhThucThanhToan>${data.paymentmethod}</HinhThucThanhToan>
                                                         <NguoiThuHuong>${data.nguoinhan}</NguoiThuHuong>
                                                         <NganHangThuHuong>${data.tennganhang}</NganHangThuHuong>
                                                         <SoTaiKhoan>${data.sotaikhoannhan}</SoTaiKhoan>
                                                      </FooterInfomation>
                                                      <Sign>
                                                      <NgayThangNam>${getFormatDate(d,2)}</NgayThangNam>
                                                      </Sign>
                                                   </MAIN>
                                                </form1>`

                                                console.log('xml:', xml)

                                                var dataEncode = window.btoa(unescape(encodeURIComponent(xml)))

                                                var requestPDF = JSON.stringify({
                                                    "id": `${data.zdenghi}${data.gjahr}`,
                                                    "report": 'DENGHI',
                                                    "xdpTemplate": 'DENGHI/DENGHI',
                                                    "zxmlData": dataEncode,
                                                    "printMoi": 'X'
                                                });
                                                var url_render = "https://" + window.location.hostname + "/sap/bc/http/sap/z_api_adobe?=";
                                                $.ajax({
                                                    url: url_render,
                                                    type: 'POST',
                                                    contentType: "application/json",
                                                    data: requestPDF,
                                                    success: function (response, textStatus, jqXHR) {
                                                        console.log(response)
                                                        let json = JSON.parse(response)
                                                        //goi thanh cong -> in form
                                                        console.log("Data: ", json);
                                                        console.log('FileContent: ', json.fileContent)
                                                        var decodePDFContent = atob(json.fileContent) // base64 to string ?? to PDF

                                                        var byteArray = new Uint8Array(decodePDFContent.length);

                                                        for (var i = 0; i < decodePDFContent.length; i++) {
                                                            byteArray[i] = decodePDFContent.charCodeAt(i);
                                                        }

                                                        var blob = new Blob([byteArray.buffer], {
                                                            type: 'application/pdf'
                                                        });

                                                        var _pdfurl = URL.createObjectURL(blob);
                                                        this._PDFViewer = new sap.m.PDFViewer({
                                                            width: 'auto',
                                                            source: _pdfurl
                                                        });
                                                        jQuery.sap.addUrlWhitelist("blob");
                                                        // }
                                                        this._PDFViewer.downloadPDF()
                                                        thatController.busyDialog.close()

                                                    },
                                                    error: function (data) {
                                                        console.log('Message Error: ' + JSON.stringify(json));
                                                    }
                                                })
                                            }
                                        })
                                    },
                                    error: function (error) {
                                        console.log(error)
                                    }
                                })

                            } else if (data.ctdenghi == 'B') {
                                console.log(data)
                             
                                const formatter = new Intl.NumberFormat('vi-VN', {
                                    currency: data.transactioncurrency,
                                });
                                var listItem = ''
                                var thoiHanThanhToan = ''
                                oModelDeNghi.read(`${element.getPath()}/to_item`, {
                                    success: function (oData, oResponse) {
                                        console.log(oData)
                                        var stt = 0
                                        var tong = 0
                                        oData.results.forEach(item => {
                                            thoiHanThanhToan = item.ngayhoadon == null ? '00/00/0000' :getFormatDate(item.ngayhoadon,2)
                                            tong += Number(item.sotiendenghi)

                                        })
                                        console.log(tong)
                                        var spellAmount = JSON.stringify({ "amount": `${data.sotiendenghi}`, "waers": `${data.transactioncurrency}`, "lang": "VI" })

                                        var url_amountWords = "https://" + window.location.hostname + "/sap/bc/http/sap/zcore_api_amount_in_words";
                                        $.ajax({
                                            url: url_amountWords,
                                            type: "POST",
                                            contentType: "application/json",
                                            data: spellAmount,
                                            beforeSend: function (xhr) {
                                                xhr.setRequestHeader('Authorization', 'Basic UFRQOnhucEtmbkxUcFNwa2N2SEdiSnBVOXUmTmVXZ3hEYXhXWVBwTHV2Vnk=');
                                            },
                                            success: function (resp, textStatus, jqHXR) {
                                                var dataWord = JSON.parse(resp);
                                                var xml = `<?xml version="1.0" encoding="UTF-8"?>
                                                <form1>
                                                   <MAIN> 
                                                   <Subform1>
                                                   <Heading>
                                                <companyCodeName>CÔNG TY CỔ PHẦN DƯỢC LIỆU TRUNG ƯƠNG 2</companyCodeName>
                                                <companyCodeAdress>24 Nguyễn Thị Nghĩa, Phường Bến Thành, Quận 1</companyCodeAdress>
                                                <Tel_Fax>
                                                   <companyCodePhone>Tel: (08)38323058</companyCodePhone>
                                                   <companyCodeFax>38323012</companyCodeFax>
                                                </Tel_Fax>
                                                <Email_Web>
                                                   <companyCodeEmail>Email: info@phytopharma.vn</companyCodeEmail>
                                                   <companyCodeWeb>Website: www.phytopharma.vn</companyCodeWeb>
                                                </Email_Web>
                                             </Heading>
                                          </Subform1>
                                          </MAIN>
                   <kinhGui>
                      <title>GIẤY ĐỀ NGHỊ TẠM ỨNG</title>
                      <date>${getFormatDate(data.pst_date,2)}</date>
                   </kinhGui>
                   <HeaderInfo>
                      <So>${data.zdenghi}</So>
                      <ToiTen>${data.nguoidenghi}</ToiTen>
                      <DonViCongTac>${data.donvicongtac}</DonViCongTac>
                      <DeNghiChoTamUng>${formatter.format(data.sotiendenghi)}</DeNghiChoTamUng>
                      <BangChu>${dataWord.Result}</BangChu>
                      <NoiDungTamUng>${data.lydothanhtoan}</NoiDungTamUng>
                      <ThoiHanThanhToan>${thoiHanThanhToan}</ThoiHanThanhToan>
                      <SoDuCongNo>${data.soducongno}</SoDuCongNo>
                      <HinhThucTamUng>${data.paymentmethod}</HinhThucTamUng>
                      <TenTaiKhoan>${data.nguoinhan}</TenTaiKhoan>
                      <SoTaiKhoan>${data.sotaikhoannhan}</SoTaiKhoan>
                      <NganHang>${data.tennganhang}</NganHang>
                   </HeaderInfo>
                   <Sign/>
                </form1>`
                                               

                                                console.log('xml:', xml)

                                                var dataEncode = window.btoa(unescape(encodeURIComponent(xml)))

                                                var requestPDF = JSON.stringify({
                                                    "id": `${data.zdenghi}${data.gjahr}`,
                                                    "report": 'TAMUNG',
                                                    "xdpTemplate": 'TAMUNG/TAMUNG',
                                                    "zxmlData": dataEncode,
                                                    "printMoi": 'X'
                                                });
                                                var url_render = "https://" + window.location.hostname + "/sap/bc/http/sap/z_api_adobe?=";
                                                $.ajax({
                                                    url: url_render,
                                                    type: 'POST',
                                                    contentType: "application/json",
                                                    data: requestPDF,
                                                    beforeSend: function (xhr) {
                                                        xhr.setRequestHeader('Authorization', 'Basic UFRQOnhucEtmbkxUcFNwa2N2SEdiSnBVOXUmTmVXZ3hEYXhXWVBwTHV2Vnk=');
                                                    },
                                                    success: function (response, textStatus, jqXHR) {
                                                        console.log(response)
                                                        let json = JSON.parse(response)
                                                        //goi thanh cong -> in form
                                                        console.log("Data: ", json);
                                                        console.log('FileContent: ', json.fileContent)
                                                        var decodePDFContent = atob(json.fileContent) // base64 to string ?? to PDF

                                                        var byteArray = new Uint8Array(decodePDFContent.length);

                                                        for (var i = 0; i < decodePDFContent.length; i++) {
                                                            byteArray[i] = decodePDFContent.charCodeAt(i);
                                                        }

                                                        var blob = new Blob([byteArray.buffer], {
                                                            type: 'application/pdf'
                                                        });

                                                        var _pdfurl = URL.createObjectURL(blob);
                                                        this._PDFViewer = new sap.m.PDFViewer({
                                                            width: 'auto',
                                                            source: _pdfurl
                                                        });
                                                        jQuery.sap.addUrlWhitelist("blob");
                                                        // }
                                                        this._PDFViewer.downloadPDF()
                                                        thatController.busyDialog.close()

                                                    },
                                                    error: function (data) {
                                                        console.log('Message Error: ' + JSON.stringify(json));
                                                    }
                                                })
                                            }
                                        })
                                    },
                                    error: function (error) {
                                        console.log(error)
                                    }
                                })

                            } else if (data.ctdenghi == 'C') {
                                template = 'THANHTOANHOANUNG/THANHTOANHOANUNG'
                                report = 'TTHOANUNG'
                                console.log(data)
                                console.log(data + "phieu thanh  toan tam ung")
                            }
                        })
                        .catch((error) => {
                            thatController.busyDialog.close()
                            MessageBox.error(`Có lỗi xảy ra: ${error.message}`)
                        })
                })
            }
        }
    }
)

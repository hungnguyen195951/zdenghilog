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
    "sap/m/MessageToast",
    'sap/ui/model/odata/v2/ODataModel',
    "sap/ui/model/Filter",


],
    function (Controller, Fragment, JSONModel, MessageItem, MessageView, MessageBox, coreLibrary, Dialog, Button, Bar, Title, IconPool, MessageToast, ODataModel , Filter) {
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
                        id: "idBusyDialogDeNghiLog",
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
            onPostDeNghiMoi :function (oEvent) {
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
                var thatController = this
                let oSelectedContext = this.extensionAPI.getSelectedContexts();
                ///sap/opu/odata/sap/ZFI_UI_DNTT_DNTU_O2
                //      var urlMain = "https://" + window.location.hostname + "/sap/opu/odata/sap/ZSD_UI_BAOCAOBANHANG_O2"
                //      var urlMainDeNghi = "https://" + window.location.hostname + "/sap/opu/odata/sap/ZFI_UI_DNTT_DNTU_O2"
                //      console.log(urlMain)
                //      console.log(urlMainDeNghi)
                // var filterArr = []
                // const d = new Date();
                // filterArr.push(new Filter("P_KeyDate", "EQ", d))
                // filterArr.push(new Filter("p_ctu","EQ","A"))
                // var oDataModelDeNghi = new ODataModel(urlMain, { json: true });
                // var oDataModelDeNghi1 = new ODataModel(urlMainDeNghi, { json: true });
                // console.log(oDataModelDeNghi)
                // console.log(oDataModelDeNghi1)
                // oDataModelDeNghi1.read(`/ZFI_DENGHI_FINAL`,{
                //     filters: filterArr,
                //     urlParameters: {
                //         "$top": 10000
                // },
                //     success: function (dataTax,responseTax){
                //         console.log(dataTax)
                //     } } )
                // oDataModelDeNghi.read(`/ZSD_I_BAOCAOBANHANG`,{
                //     success: function (dataTax,responseTax){
                //         console.log(dataTax)
                //     } } )
                const VND = new Intl.NumberFormat('en-DE');
                if(oSelectedContext.length == 0){
                    MessageBox.error("Hãy chọn chứng từ muốn đề nghị mới!")
                    return
                }else{
                    this.openBusyDialog()
                oSelectedContext.forEach(element=>{
                    let oModelDeNghi = element.getModel()
                    oModelDeNghi.read(element.getPath(), {
                        success: function (oData, oResponse) {
                            console.log(oData)
                            if(oData.is_del != ''){
                                thatController.busyDialog.close()
                                MessageBox.error('Chứng từ đã được xóa!')
                                console.log(error.message)
                                return 
                            }else{
                            if(oData.ctdenghi == 'A'){
                                if(!thatController.reviewDialog){
                                    var items = [
                                       { stt:  "1",
                                        sohoadon: oData.sohoadon,
                                        ngayhoadon: `${getFormatDate(oData.ngayhoadon,1)}`,
                                        diengiai: oData.diengiai,
                                        transactioncurrency: oData.transactioncurrency,
                                        
                                        sotientruocthueUi: VND.format(oData.sotientruocthue),
                                        sotientruocthue: oData.sotientruocthue,
            
                                        vatUi: VND.format(oData.vat),
                                        vat: oData.vat,
            
                                        sotiendenghiUi: VND.format(oData.sotiendenghi),
                                        sotiendenghi: oData.sotiendenghi,
            
                                        // sotientamungUi: VND.format(item.soTienTamUng),
                                        // sotientamung: item.sotientamung,
                                        // thoihantamung: `${String(item.DueCalculationBaseDate.getDate()).padStart(2, '0')}/${item.DueCalculationBaseDate.getMonth() + 1}/${item.DueCalculationBaseDate.getFullYear()}`,
            
                                        accountingdocument: oData.accountingdocument,
                                        accountingdocumentyear: oData.accountingdocumentyear,
                                        accountingcompanycode: oData.accountingcompanycode,
                                        customer: oData.customer,
                                        supplier: oData.supplier,
                                        statuscritical: oData.statuscritical}
                                    ]
                                    oData = {...oData,items:items,                 
                                        sumTongCong: VND.format(oData.sotiendenghi),
                                        sumTongCongBF: oData.sotiendenghi,
                                        companyCodeNameUI : `<strong>CÔNG TY CỔ PHẦN DƯỢC LIỆU TRUNG ƯƠNG 2</strong>`,
                                        companyCodeAdressUI : `<strong>24 Nguyễn Thị Nghĩa, Phường Bến Thành, Quận 1</strong>`,
                                        companyCodePhoneUI : `<strong>Telephone: </strong>(08)38323058`,
                                        companyCodeFaxUI : `<strong>Fax: </strong>38323012`,
                                        companyCodeEmailUI: "<strong>Email: </strong>info@phytopharma.vn",
                                        companyCodeWebUI: "<strong>Website: </strong>www.phytopharma.vn"
                                    }
                                    console.log(oData)
                                    Fragment.load({
                                        id: "reviewFragment",
                                        name: "zdenghilog.ext.fragment.ReviewDenghi",
                                        type: "XML",
                                        controller: thatController
                                    })
                                        .then((oDialog) => {
                                            let oModel = new JSONModel(oData);
                                            console.log(oModel)
                                            thatController.reviewDialog = oDialog;
                                            thatController.reviewDialog.setModel(oModel, "ReviewData")
                                            thatController.reviewDialog.open()
                                            thatController.busyDialog.close()
                                        })
                                        .catch(error => {
                                            thatController.busyDialog.close()
                                            MessageBox.error('Vui lòng tải lại trang')
                                            console.log(error.message)
                                        });
                                    
                                }else{
                                    console.log(oData)
                                    var items = [
                                       { stt:  1,
                                        sohoadon: oData.sohoadon,
                                        ngayhoadon: `${getFormatDate(oData.ngayhoadon,1)}`,
                                        diengiai: oData.diengiai,
                                        transactioncurrency: oData.transactioncurrency,
                                        
                                        sotientruocthueUi: VND.format(oData.sotientruocthue),
                                        sotientruocthue: oData.sotientruocthue,
            
                                        vatUi: VND.format(oData.vat),
                                        vat: oData.vat,
            
                                        sotiendenghiUi: VND.format(oData.sotiendenghi),
                                        sotiendenghi: oData.sotiendenghi,
            
                                        // sotientamungUi: VND.format(item.soTienTamUng),
                                        // sotientamung: item.sotientamung,
                                        // thoihantamung: `${String(item.DueCalculationBaseDate.getDate()).padStart(2, '0')}/${item.DueCalculationBaseDate.getMonth() + 1}/${item.DueCalculationBaseDate.getFullYear()}`,
            
                                        accountingdocument: oData.accountingdocument,
                                        accountingdocumentyear: oData.accountingdocumentyear,
                                        accountingcompanycode: oData.accountingcompanycode,
                                        customer: oData.customer,
                                        supplier: oData.supplier,
                                        statuscritical: oData.statuscritical}
                                    ]
                                    oData = {...oData,items:items,                 
                                        sumTongCong: VND.format(oData.sotiendenghi),
                                        sumTongCongBF: oData.sotiendenghi,
                                        companyCodeNameUI : `<strong>CÔNG TY CỔ PHẦN DƯỢC LIỆU TRUNG ƯƠNG 2</strong>`,
                                        companyCodeAdressUI : `<strong>24 Nguyễn Thị Nghĩa, Phường Bến Thành, Quận 1</strong>`,
                                        companyCodePhoneUI : `<strong>Telephone: </strong>(08)38323058`,
                                        companyCodeFaxUI : `<strong>Fax: </strong>38323012`,
                                        companyCodeEmailUI: "<strong>Email: </strong>info@phytopharma.vn",
                                        companyCodeWebUI: "<strong>Website: </strong>www.phytopharma.vn"
                                    }
                                    console.log(oData)
                                    let oModel = new JSONModel(oData);
                                    thatController.reviewDialog.setModel(oModel, "ReviewData")
                                    thatController.reviewDialog.open()
                                    thatController.busyDialog.close()
                                }
                            }else 
                            // if (oData.ctdenghi == 'B')
                            {
                                thatController.busyDialog.close()
                                MessageBox.error('Chỉ được chọn chứng từ Đề nghị thanh toán!')
                                return
                                var items = [
                                    { stt:  "1",
                                     sohoadon: oData.sohoadon,
                                     ngayhoadon: `${oData.ngayhoadon != '' && oData.ngayhoadon != null ? getFormatDate(oData.ngayhoadon,1) : '' }`,
                                     diengiai: oData.diengiai,
                                     transactioncurrency: oData.transactioncurrency,
                                     
                                     sotientruocthueUi: VND.format(oData.sotientruocthue),
                                     sotientruocthue: oData.sotientruocthue,
         
                                     vatUi: VND.format(oData.vat),
                                     vat: oData.vat,
         

         
                                     // sotientamungUi: VND.format(item.soTienTamUng),
                                     // sotientamung: item.sotientamung,
                                     // thoihantamung: `${String(item.DueCalculationBaseDate.getDate()).padStart(2, '0')}/${item.DueCalculationBaseDate.getMonth() + 1}/${item.DueCalculationBaseDate.getFullYear()}`,
         
                                     accountingdocument: oData.accountingdocument,
                                     accountingdocumentyear: oData.accountingdocumentyear,
                                     accountingcompanycode: oData.accountingcompanycode,
                                     customer: oData.customer,
                                     supplier: oData.supplier,
                                     statuscritical: oData.statuscritical}
                                 ]
                                 oData = {...oData,items:items,                 
                                     sumTongCong: VND.format(oData.sotiendenghi),
                                     sumTongCongBF: oData.sotiendenghi,
                                     companyCodeNameUI : `<strong>CÔNG TY CỔ PHẦN DƯỢC LIỆU TRUNG ƯƠNG 2</strong>`,
                                     companyCodeAdressUI : `<strong>24 Nguyễn Thị Nghĩa, Phường Bến Thành, Quận 1</strong>`,
                                     companyCodePhoneUI : `<strong>Telephone: </strong>(08)38323058`,
                                     companyCodeFaxUI : `<strong>Fax: </strong>38323012`,
                                     companyCodeEmailUI: "<strong>Email: </strong>info@phytopharma.vn",
                                     companyCodeWebUI: "<strong>Website: </strong>www.phytopharma.vn",
                                     sotientamungUi: VND.format(oData.sotiendenghi),
                                     sotientamung: oData.sotiendenghi,
                                 }
                                 console.log(oData)
                                if (!thatController.reviewTamUngDialog) {
                                    Fragment.load({
                                        id: "reviewtTamUngFragment",
                                        name: "zdenghilog.ext.fragment.ReviewDeNghiTamUng",
                                        type: "XML",
                                        controller: thatController
                                    })
                                        .then((oDialog) => {
                                            let oModel = new JSONModel(oData);
                                            console.log(oModel)
                                            thatController.reviewTamUngDialog = oDialog;
                                            thatController.reviewTamUngDialog.setModel(oModel, "ReviewData")
                                            thatController.reviewTamUngDialog.open()
                                            thatController.busyDialog.close()
                                        })
                                        .catch(error => {
                                            MessageBox.error('Vui lòng tải lại trang')
                                        });
                                } else {
                                    let oModel = new JSONModel(oData);
                                    thatController.reviewTamUngDialog.setModel(oModel, "ReviewData")
                                    thatController.reviewTamUngDialog.open()
                                    thatController.busyDialog.close()
                                }
                            }
                        }
                        },
                        error: function (error) {
                   
                        }
                    })
                })
            }
                    
            },
            onCloseReviewDialog: function (oEvent) {
                this.reviewDialog.close()
            },
            onCloseReviewTamUngDialog: function(oEvent){
                this.reviewTamUngDialog.close()
            }
            ,onPrintDeNghiMoi: function (oEvent) {
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
                // this.openBusyDialog()
                this.openBusyDialog()
                var thatController = this
                let dataRequest = this.reviewDialog.getModel("ReviewData").getJSON()
                let dataJSON = JSON.parse(dataRequest)
                console.log(dataJSON)
                console.log(dataRequest)
                if (dataJSON.ctdenghi == 'A') {
                    console.log(dataJSON)
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
                 <So>${dataJSON.zdenghi}</So>
              </kinhGui>
              <HeaderInfo>
                 <ToiTen>${dataJSON.nguoidenghi}</ToiTen>
                 <DonViCongTac>${dataJSON.donvicongtac}</DonViCongTac>
                 <LyDoThanhToan>${dataJSON.lydothanhtoan}</LyDoThanhToan>
              </HeaderInfo>`
                    const formatter = new Intl.NumberFormat('vi-VN', {
                        currency: dataJSON.transactioncurrency,
                    });
                    var listItem = ''
                    var stt= 0
                    const d = new Date()
                    var tong =0
                    dataJSON.items.forEach(item => {
                                stt++
                                listItem += `<Data>
                                <STT>${stt}</STT>
                                <DocumentNumber>${item.accountingdocumenttype == 'RE' ? item.supplierinvoice : item.accountingdocument}</DocumentNumber>
                                <SoHoaDon>${item.sohoadon}</SoHoaDon>
                                <NgayHoaDon>${item.ngayhoadon}</NgayHoaDon>
                                <DienGiai>${item.diengiai}</DienGiai>
                                <TriGia>${formatter.format(item.sotientruocthue)}</TriGia>
                                <VAT>${item.vat}</VAT>
                                <TongCong>${formatter.format(item.sotiendenghi)}</TongCong>
                             </Data>`
                                tong += Number(item.sotiendenghi)

                            })
                            console.log(tong)
                            var spellAmount = JSON.stringify({ "amount": `${tong < 0 ? tong * -1 : tong}`, "waers": `${dataJSON.transactioncurrency}`, "lang": "VI" })

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
                                             <ChungTuKemTheo>${dataJSON.ctkemtheo}</ChungTuKemTheo>
                                             <HinhThucThanhToan>${dataJSON.paymentmethod}</HinhThucThanhToan>
                                             <NguoiThuHuong>${dataJSON.nguoinhan}</NguoiThuHuong>
                                             <NganHangThuHuong>${dataJSON.tennganhang}</NganHangThuHuong>
                                             <SoTaiKhoan>${dataJSON.sotaikhoannhan}</SoTaiKhoan>
                                          </FooterInfomation>
                                          <Sign>
                                          <NgayThangNam>${getFormatDate(d,2)}</NgayThangNam>
                                          </Sign>
                                       </MAIN>
                                    </form1>`

                                    console.log('xml:', xml)

                                    var dataEncode = window.btoa(unescape(encodeURIComponent(xml)))

                                    var requestPDF = JSON.stringify({
                                        "id": `${dataJSON.zdenghi}${dataJSON.gjahr}`,
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
                                            thatController.reviewDialog.close();

                                        },
                                        error: function (data) {
                                            thatController.busyDialog.close()
                                            console.log('Message Error: ' + JSON.stringify(json));
                                        }
                                    })
                                }
                            })


                }else if (dataJSON.ctdenghi == 'B'){

                }
            },
            onChangeTongCong: function (oEvent) {
                // MessageToast.show("Details for product with id " + this.getView().getModel());
                const VND = new Intl.NumberFormat('en-DE');

                let data = oEvent.getSource().getParent().getRowBindingContext().getObject()

                let VATFloat = 0
                if (data.vat) {
                    VATFloat = parseFloat(data.vat)
                }
                data.vatUi = VND.format(data.vat)

                let newTriGiaFloat = 0
                if (data.sotientruocthue) {
                    newTriGiaFloat = parseFloat(data.sotientruocthue)
                }
                data.sotientruocthueUi = VND.format(data.sotientruocthue)

                let newTongCong = newTriGiaFloat + VATFloat
                data.sotiendenghiUi = VND.format(newTongCong)
                data.sotiendenghi = newTongCong

                let newSumTongCong = 0
                let reviewData = this.reviewDialog.getModel("ReviewData").getData()

                reviewData.items.forEach((value) => {
                    newSumTongCong = parseFloat(newSumTongCong) + parseFloat(value.sotiendenghi)
                })
                reviewData.sumTongCong = VND.format(newSumTongCong)
                reviewData.sumTongCongBF = newSumTongCong

            },
            onChangePaymentMeth: function (oEvent) {
                let reviewData = this.reviewDialog.getModel("ReviewData").getData()
                console.log(reviewData)
                if (reviewData.paymentmethod == 'Chuyển khoản') {
                    reviewData.nguoinhan =   `${!reviewData.banks[0].BankAccountHolderName ? reviewData.banks[0].BankAccountHolderName : '' }`
                    if (reviewData.nguoinhan == '') {
                        reviewData.nguoinhan = `${reviewData.AccountName}`
                    }
                    reviewData.partnerBankType = `${reviewData.banks[0].BankIdentification}`
                    reviewData.tennganhang = `${reviewData.banks[0].BankName}`
                    reviewData.sotaikhoannhan = `${reviewData.banks[0].BankAccount}`
                    reviewData.partnerBankTypeVisible = true
                } else if (reviewData.paymentmethod == 'Tiền mặt' || reviewData.paymentmethod == 'Phương thức khác') {
                    reviewData.nguoinhan = `${reviewData.AccountName}`
                    reviewData.tennganhang = ''
                    reviewData.sotaikhoannhan = ''
                    reviewData.partnerBankTypeVisible = false
                }

            },
            onChangePaymentMethTamUng: function (oEvent){
                let reviewData = this.reviewTamUngDialog.getModel("ReviewData").getData()
                if (reviewData.paymentmethod == 'Chuyển khoản') {
                    reviewData.nguoinhan = `${reviewData.banks[0].BankAccountHolderName}`
                    if (reviewData.nguoinhan == '') {
                        reviewData.nguoinhan = `${reviewData.AccountName}`
                    }
                    reviewData.partnerBankType = `${reviewData.banks[0].BankIdentification}`
                    reviewData.tennganhang = `${reviewData.banks[0].BankName}`
                    reviewData.sotaikhoannhan = `${reviewData.banks[0].BankAccount}`
                    reviewData.partnerBankTypeVisible = true
                } else if (reviewData.paymentmethod == 'Tiền mặt' || reviewData.paymentmethod == 'Phương thức khác') {
                    reviewData.nguoinhan = `${reviewData.AccountName}`
                    reviewData.tennganhang = ''
                    reviewData.sotaikhoannhan = ''
                    reviewData.partnerBankTypeVisible = false
                }
            },
            onChangePartnerBankType:function (oEvent) {
                let reviewData = this.reviewDialog.getModel("ReviewData").getData()
                if (reviewData.partnerBankType) {
                    let chosenBank = reviewData.banks.filter(obj => {
                        return obj.BankIdentification === reviewData.partnerBankType;
                    });
                    reviewData.nguoinhan = `${chosenBank[0].BankAccountHolderName}`
                    if (reviewData.nguoinhan == '') {
                        reviewData.nguoinhan = `${reviewData.AccountName}`
                    }
                    reviewData.tennganhang = `${chosenBank[0].BankName}`
                    reviewData.sotaikhoannhan = `${chosenBank[0].BankAccount}`
                }
            },
            onChangePartnerBankTypeTamUng:function (oEvent) {
                let reviewData = this.reviewTamUngDialog.getModel("ReviewData").getData()
                if (reviewData.partnerBankType) {
                    let chosenBank = reviewData.banks.filter(obj => {
                        return obj.BankIdentification === reviewData.partnerBankType;
                    });
                    reviewData.nguoinhan = `${chosenBank[0].BankAccountHolderName}`
                    if (reviewData.nguoinhan == '') {
                        reviewData.nguoinhan = `${reviewData.AccountName}`
                    }
                    reviewData.tennganhang = `${chosenBank[0].BankName}`
                    reviewData.sotaikhoannhan = `${chosenBank[0].BankAccount}`
                }
            }
        }
    }
)

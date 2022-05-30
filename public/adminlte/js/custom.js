


$(document).ready(function () {

  

$('input#name_slug').keyup(function(){
    $('input[name="slug"]').val(change_alias($(this).val()));
 });
 
    //check selectbox
    change_form_action("#zt-form .slbAction", "#zt-form","#btn-action");

   // CKEDITOR
   if ($('textarea#content_ck').length) {
    CKEDITOR.replace('content_ck');
}

    //
    function change_form_action(slb_selector, form_selector, id_btn_action) {

        var optValue;
        var isDelete = false;
        var pattenCheckDelete = new RegExp("delete", "i");

        $(slb_selector).on("change", function () {
            optValue = $(this).val();
            
           
            if(optValue !== "") {
                $(id_btn_action).removeAttr('disabled');
            } else {
                $(id_btn_action).attr('disabled', 'disabled');
            }
            $(form_selector).attr("action", optValue);
        });

        $(form_selector + " .btnAction").on("click", function () {
            isDelete = pattenCheckDelete.test($(slb_selector).val());
            if(isDelete){
                var confirmDelete = confirm('Are you really want to delete?');
                if(confirmDelete === false){
                    return;
                }
            }

            var numberOfChecked = $(form_selector + ' input[name="cid"]:checked').length;
            if (numberOfChecked == 0) {
                alert("Please choose some items");
                return;
            } else {
                var flag = false;
                var str = $(slb_selector + " option:selected").attr('data-comfirm');
               
                if (str != undefined) {

                    //Kiểm tra giá trị trả về khi user nhấn nút trên popup
                    flag = confirm(str);
                    if (flag == false) {
                        return flag;
                    } else {
                        $(form_selector).submit();
                    }

                } else {
                    if (optValue != undefined) {
                        $(form_selector).submit();
                    }
                }
            }

        });
    }
    var ckbAll = $(".cbAll");
    //check all
    ckbAll.click(function () {
        $('input:checkbox').not(this).prop('checked', this.checked);
        if ($(this).is(':checked')) {
            $(".ordering").attr("name", "ordering");
        }else{
           
            $(".ordering").removeAttr("name");
        }
        
    });



    $.widget.bridge('uibutton', $.ui.button);

    // Active Menu
    activeMenu();
    

    let $btnSearch = $('button#btn-search');
    let $btnClearSearch = $('button#btn-clear-search');
    let $inputSearchValue = $('input[name = search_value]');

    var searchParams = new URLSearchParams(window.location.search);
    let moduleName = searchParams.get('module');
    let controllerName = searchParams.get('controller');
    var searchParamsEntries = searchParams.entries();

    $inputSearchValue.keyup(function (event) {
        if (event.keyCode === 13) {
            $btnSearch.click();
        }
    });

    // Search Event
    $btnSearch.click(function () {
        let searchValue = $inputSearchValue.val().trim();
        let searchField = $('.select-search-field').val();
        if (searchValue != '') {
            let exceptParams = ['search_value', 'search_field', 'page'];
            let link = createLink(exceptParams);
            link +=
                'search_field=' +
                searchField +
                '&search_value=' +
                searchValue.replace(/\s+/g, '+').toLowerCase();
            window.location.href = link;
        } else {
            showToast('warning', 'Nhập nội dung cần tìm kiếm!');
        }
    });

    // Clear Search Event
    $btnClearSearch.click(function () {
        $inputSearchValue.val('');
    });

    // Switch GroupACP Change Event
    $('input.chkGroupACP').each(function () {
        $(this).change(function () {
            let checkbox = $(this);
            let url = $(this).data('url');
            $.get(
                url,
                function (data) {
                    $('.modified-' + data.id).html(data.modified);
                    checkbox.data('url', data.link);
                    showToast('success', 'update');
                },
                'json'
            );
        });
    });

    // Change state event
    $('.my-btn-state').click(function (e) {
        $myBtnState = $(this);
        let url = $(this).attr('href');
        let id = $(this).data('id');
        let u =  $(this).data('u');
        $.get(
            url,
            function (data) { 
                let {status} = data; 
            //let $rs = $(data).find(`.my-btn-state[data-id='${id}']`);
                if (status == 'active') {
                    $myBtnState.removeClass('btn-danger');
                    $myBtnState.addClass('btn-success');
                    $myBtnState.find('i').attr('class', 'fas fa-check');
                } else {
                    $myBtnState.removeClass('btn-success');
                    $myBtnState.addClass('btn-danger');
                    $myBtnState.find('i').attr('class', 'fas fa-minus');
                }
              //  $('.modified-' + id).html(data.modified);
                $myBtnState.attr('href', u+status);
                // showToast('success', 'update');
                $myBtnState.notify(`Status is changed to ${status}`, {
                    className: 'success',
                    position: 'top center',
                    autoHideDelay:1300
                });
             },
             'json'
        ); 
        e.preventDefault();
    });

    // Change group event
    $('[name="select-group"]').change(function () {
        $currentSelectGroup = $(this);
        let groupId = $(this).val();
        let userId = $(this).data('id');
        let url = `index.php?module=admin&controller=user&action=ajaxChangeGroup&id=${userId}&group_id=${groupId}`;
        $.get(
            url,
            function (data) {
                $('.modified-' + data.id).html(data.modified);
                 showToast('success', 'edit');
                $currentSelectGroup.notify('Cập nhật thành công!', {
                    className: 'success',
                    position: 'top center',
                    
                },
                
                );
            },
            'json'
        );
    });

    //change selected category
         
       let arr =   $('.selectChange');
    for(let i=0; i< arr.length; i++){
        arr[i].addEventListener('change',()=>{
            let idArticle = arr[i].getAttribute('data-id')
            let sbl = arr[i].querySelector(`#selectedCategory${idArticle}`);
            let dataPost = {
                        idCategory : sbl.value,
                        idArtical : idArticle,
                        textCategory : sbl.options[sbl.selectedIndex].text
                    };
                    let url = arr[i].getAttribute('data-link')+'change-category/';
                            $.post(
                                url, 
                                dataPost,
                                function (data) {
                            if (data.result == 'OK') {
                                $(`.selectChange #selectedCategory${idArticle}`).notify(`Category is changed to ${dataPost.textCategory}`, {
                                    className: 'success',
                                    position: 'top center',
                                    autoHideDelay:1300
                                });
                                }
                                },
                                'json'
                                );
        });

    }
     
       
    //Filter category
    $('#chooseCategory').change(async function(){ 
        let idFilter = await $('#chooseCategory').val();
        if(idFilter == 'allvalue'){
            window.location.reload();
        }
        else{
            $('#chooseCategory option').each(function(){
          let  idAll = $(this).val(); 
            if(idAll == idFilter){
                $(`.${idAll}`).show();
            }
            else{
                $(`.${idAll}`).hide();
            }
        });
        }      
    })   
       
    

    
        
    // Hide old image while preview another image
    $('#admin-file-upload').change(function(){
        $('#imgShow').hide()
    })    
       

    // Change ordering event
    $('.chkOrdering').change(function () {
        $chkOrdering = $(this);
        let ordering = $(this).val();
        let id = $(this).data('id');
        let linkIndex = $('#zt-form').data('link');
        let url = `${window.location.origin}${linkIndex}change-ordering/${id}/${ordering}`;
   
        $.get(url, function (data) {
            if (data) {
                $chkOrdering.notify(`Ordering is changed to ${ordering}`, {
                    className: 'success',
                    elementPosition: 'top center',
                    autoHideDelay:1300
                });
            }
        });
    });



    // Check all for bulk action
    $('#check-all').change(function () {
        var checkStatus = this.checked;
        $('#form-table input[name="checkbox[]"]').each(function () {
            this.checked = checkStatus;
        });
        showSelectedRowInBulkAction();
    });

    $('#form-table input[name="checkbox[]"]').change(function () {
        showSelectedRowInBulkAction();
    });

    // Bulk Action
    $('#bulk-apply').click(function () {
        var action = $('#bulk-action').val();
        var checkbox = $('#form-table input[name="checkbox[]"]:checked');
        let lstID = [];
        checkbox.each(function () {
            lstID.push($(this).val());
        });
        if (checkbox.length > 0) {
            switch (action) {
                case 'multi-delete':
                    Swal.fire(
                        confirmObj(
                            'Bạn chắc chắn muốn xóa các dòng dữ liệu đã chọn?',
                            'error',
                            'Xóa'
                        )
                    ).then((result) => {
                        if (result.value) {
                            $('#form-table').attr(
                                'action',
                                `index.php?module=${moduleName}&controller=${controllerName}&action=delete`
                            );
                            $('#form-table').submit();
                        }
                    });
                    break;
                case 'multi-ordering':
                    Swal.fire(
                        confirmObj('Cập nhật các dòng dữ liệu đã chọn?', 'info', 'Cập nhật')
                    ).then((result) => {
                        if (result.value) {
                            $('#form-table .chkOrdering').each(function () {
                                if (!lstID.includes($(this).data('id').toString())) {
                                    $(this).attr('disabled', true);
                                }
                            });
                            $('#form-table').attr(
                                'action',
                                `index.php?module=${moduleName}&controller=${controllerName}&action=ordering`
                            );
                            $('#form-table').submit();
                        }
                    });
                    break;
                case 'multi-active':
                    Swal.fire(
                        confirmObj('Cập nhật các dòng dữ liệu đã chọn?', 'info', 'Cập nhật')
                    ).then((result) => {
                        if (result.value) {
                            $('#form-table').attr(
                                'action',
                                `index.php?module=${moduleName}&controller=${controllerName}&action=active`
                            );
                            $('#form-table').submit();
                        }
                    });
                    break;
                case 'multi-inactive':
                    Swal.fire(
                        confirmObj('Cập nhật các dòng dữ liệu đã chọn?', 'info', 'Cập nhật')
                    ).then((result) => {
                        if (result.value) {
                            $('#form-table').attr(
                                'action',
                                `index.php?module=${moduleName}&controller=${controllerName}&action=inactive`
                            );
                            $('#form-table').submit();
                        }
                    });
                    break;
                default:
                    showToast('warning', 'bulk-action-not-selected-action');
                    break;
            }
        } else {
            showToast('warning', 'bulk-action-not-selected-row');
        }
    });

    // Preview image before upload
    $('#admin-file-upload').change(function () {
        filePreview(this);
    });

    // CKEditor
    if ($('#editor').length > 0) {
        ClassicEditor.create(document.querySelector('#editor'), {
            // plugins: [ CKFinder ],
            // toolbar: [ 'ckfinder'],
            ckfinder: {
                uploadUrl:
                    'public/template/admin/adminlte/js/ckfinder/core/connector/php/connector.php?command=QuickUpload&type=Images&responseType=json',
            },
        }).catch(function (error) {
            console.error(error);
        });
    }

    // Filter Group
    $('[name="filter_group"]').change(function () {
        let exceptParams = ['page', 'sort_field', 'sort_order', 'filter_group'];
        let link = createLink(exceptParams);
        link += `filter_group=${$(this).val()}`;
        window.location.href = link;
    });

    // Filter Special
    $('[name="filter_special"]').change(function () {
        let exceptParams = ['page', 'sort_field', 'sort_order', 'filter_special'];
        let link = createLink(exceptParams);
        link += `filter_special=${$(this).val()}`;
        window.location.href = link;
    });

    // Filter Category
    $('[name="filter_category"]').change(function () {
        let exceptParams = ['page', 'sort_field', 'sort_order', 'filter_category'];
        let link = createLink(exceptParams);
        link += `filter_category=${$(this).val()}`;
        window.location.href = link;
    });

    // Filter is home
    $('[name="filter_ishome"]').change(function () {
        let exceptParams = ['page', 'sort_field', 'sort_order', 'filter_ishome'];
        let link = createLink(exceptParams);
        link += `filter_ishome=${$(this).val()}`;
        window.location.href = link;
    });
});

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timerProgressBar: true,
    timer: 5000,
    padding: '1rem',
});

function activeMenu() {
    let pathname = window.location.pathname;
    let arrMenu = pathname.split("/");
    let currentMenu = arrMenu[2];
    $('li.nav-item a[data-active="'+currentMenu+'"]').addClass('my-active');
}

function confirmObj(text, icon, confirmText) {
    return {
        position: 'top',
        title: 'Thông báo!',
        text: text,
        icon: icon,
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: confirmText,
        cancelButtonText: 'Hủy',
    };
}

function deleteItem(id) {
    Swal.fire(confirmObj('Bạn chắc chắn muốn xóa dòng dữ liệu này?', 'error', 'Xóa')).then(
        (result) => {
            if (result.value) {
                let searchParams = new URLSearchParams(window.location.search);
                let moduleName = searchParams.get('module');
                let controllerName = searchParams.get('controller');
                window.location.href = `index.php?module=${moduleName}&controller=${controllerName}&action=delete&id=${id}`;
            }
        }
    );
}

function sortList(field, order) {
    // http://php01.test/mvc-multi/index.php?module=admin&controller=group&action=index&filter_status=active&search=a&sort_field=name&sort_order=desc
    $('input[name="sort_field"]').val(field);
    $('input[name="sort_order"]').val(order);

    let exceptParams = ['page', 'sort_field', 'sort_order'];
    let link = createLink(exceptParams);

    link += `sort_field=${field}&sort_order=${order}`;
    window.location.href = link;

    // $('#form-table').submit();
}

function submitForm(link) {
    $('#admin-form').attr('action', link);
    $('#admin-form').submit();
}

function createLink(exceptParams) {
    let pathname = window.location.pathname;
    let searchParams = new URLSearchParams(window.location.search);
    let searchParamsEntries = searchParams.entries();

    let link = pathname + '?';
    for (let pair of searchParamsEntries) {
        if (exceptParams.indexOf(pair[0]) == -1) {
            link += `${pair[0]}=${pair[1]}&`;
        }
    }
    return link;
}

function showToast(type, action) {
    let message = '';
    switch (action) {
        case 'update':
            message = 'Cập nhật thành công!';
            break;
        case 'bulk-action-not-selected-action':
            message = 'Vui lòng chọn action cần thực hiện!';
            break;
        case 'bulk-action-not-selected-row':
            message = 'Vui lòng chọn ít nhất 1 dòng dữ liệu!';
            break;
    }

    Toast.fire({
        icon: type,
        title: ' ' + message,
    });
}

function filePreview(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
            
            $('#admin-preview-image').css('display', 'block');
            $('#admin-preview-image').attr('src', e.target.result);
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function showSelectedRowInBulkAction() {
    let checkbox = $('#form-table input[name="checkbox[]"]:checked');
    let navbarBadge = $('#bulk-apply .navbar-badge');
    if (checkbox.length > 0) {
        navbarBadge.html(checkbox.length);
        navbarBadge.css('display', 'inline');
    } else {
        navbarBadge.html('');
        navbarBadge.css('display', 'none');
    }
}

    //Create slug input
    function change_alias(alias) {
        var str = alias;
        str = str.toLowerCase();
        str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a"); 
        str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e"); 
        str = str.replace(/ì|í|ị|ỉ|ĩ/g,"i"); 
        str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o"); 
        str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u"); 
        str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y"); 
        str = str.replace(/đ/g,"d");
        str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g," ");
        str = str.replace(/ *? /g,"-");
        str = str.trim(); 
        return str;
    }

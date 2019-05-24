(function ($) {
    'use strict';

    /****************************************
     *          Options
     ****************************************/

    var timeOutMaxRetry = 10,
        timeOutCurrentRetry,
        tableLastUpdate = new Date(),
        tableUpdateLoop = setInterval(function () {
            tableLoader();
        }, 1000 * 60 * 1);

    var options = [];

    var language = null;

    /**
     * Default table options
     */
    var tableDefaultOptions = {
        ajax: {
            url: null,
            urlDelimeter: '&',
            timeOut: 30000,
            reloadDelay: 10,
            async: false,
            beforeSend: null,
            successCallback: null,
            errorCallback: null,
            logError: true
        },
        results: null,
        pagination: {
            page: 1,
            limit: 25,
            order: 'desc',
            order_by: 'id',
            like: ''
        },
        table: {
            headerOrder: true,
            search: true,
            limit: true,
            pagination: true,
            rowItem: null,
            rowTr: null,
            paginationHistory: true,
            prefix: '',
            numbers: true,
            except: [],
            actions: null,
            actionColor: null,
            columns: [],
            numText: 'Num',
            actionsText: 'Actions',
            showingText: 'Showing #showing# of #total# items.',
            showingNoneText: 'There is no reuslt',
            tfoot: true
        }
    };

    /**
     * Default select options
     */
    var selectDefaultOptions = {
        ajax: {
            url: null,
            urlDelimeter: '&',
            timeOut: 30000,
            async: false,
            beforeSend: null,
            successCallback: null,
            errorCallback: null,
            logError: true
        },
        selectedValue: null,
        defaultOption: null,
        optionItem: null
    };


    /****************************************
     *          Helper functions
     ****************************************/

    /**
     * AJAX error printer
     * @param {*} jqXHR: jquery XHR error log
     * @param {*} textStatus: error status
     * @param {*} errorThrown: error thrown
     */
    function printError(jqXHR, textStatus, errorThrown) {
        console.log('--------------------------------------:');
        console.log('------------- ERROR Start ------------:');
        console.log('-------------jqXHR------------:');
        console.log(jqXHR);
        console.log('----------textStatus----------:');
        console.log(textStatus);
        console.log('----------errorThrown----------:');
        console.log(errorThrown);
        console.log('------------- ERROR End --------------:');
        console.log('--------------------------------------:');
    }

    /**
     * AJAX GET table data
     * @param {*} jqXHR: jquery XHR error log
     * @param {*} textStatus: error status
     * @param {*} errorThrown: error thrown
     */
    function ajaxGetTable(id) {
        var _response = null,
            url = options[id].ajax.url + options[id].ajax.urlDelimeter + $.param(options[id].pagination);

        $.ajax({
            url: url,
            type: 'GET',
            timeOut: options[id].ajax.timeOut,
            dataType: 'json',
            async: options[id].ajax.async,
            beforeSend: function (request) {
                if (options[id].ajax.beforeSend) {
                    options[id].ajax.beforeSend(request);
                }
            },
            success: function (response) {
                if (options[id].ajax.successCallback) {
                    options[id].ajax.successCallback(response);
                }

                _response = response;
                window[id]['data'] = response;
            },
            error: function (jqXHR, textStatus, errorThrown) {
                if (options[id].ajax.logError) {
                    printError(jqXHR, textStatus, errorThrown);
                }

                if (options[id].ajax.errorCallback) {
                    options[id].ajax.errorCallback(jqXHR, textStatus, errorThrown);
                }

                if (textStatus == 'timeout' && timeOutMaxRetry < timeOutCurrentRetry) {
                    ++timeOutCurrentRetry;
                    return getTable();
                }
            }
        });

        return _response;
    };

    /**
     * AJAX GET select data
     * @param {*} jqXHR: jquery XHR error log
     * @param {*} textStatus: error status
     * @param {*} errorThrown: error thrown
     */
    function ajaxGetSelect(id) {
        var _response = null,
            url = options[id].ajax.url;

        $.ajax({
            url: url,
            type: 'GET',
            timeOut: options[id].ajax.timeOut,
            dataType: 'json',
            async: options[id].ajax.async,
            beforeSend: function (request) {
                if (options[id].ajax.beforeSend) {
                    options[id].ajax.beforeSend(request);
                }
            },
            success: function (response) {
                if (options[id].ajax.successCallback) {
                    options[id].ajax.successCallback(response);
                }

                _response = response;
                window[id]['data'] = response;
            },
            error: function (jqXHR, textStatus, errorThrown) {
                if (options[id].ajax.logError) {
                    printError(jqXHR, textStatus, errorThrown);
                }

                if (options[id].ajax.errorCallback) {
                    options[id].ajax.errorCallback(jqXHR, textStatus, errorThrown);
                }

                if (textStatus == 'timeout' && timeOutMaxRetry < timeOutCurrentRetry) {
                    ++timeOutCurrentRetry;
                    return getTable();
                }
            }
        });

        return _response;
    };

    /**
     * Diff minutes function, require for table load dates
     * @param {*} date1: current time
     * @param {*} date2: past time
     */
    function diffMinutes(date1, date2) {
        var diff = (date2.getTime() - date1.getTime()) / 1000;
        diff /= 60;

        return Math.abs(Math.round(diff));
    }

    /**
     * Set cookie
     * https://stackoverflow.com/a/1599291
     * @param {string} name 
     * @param {string} value 
     * @param {int} days 
     */
    function setCookie(name, value, days) {
        days = days === undefined ? 365 : days;

        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            var expires = "; expires=" + date.toGMTString();
        } else var expires = "";

        document.cookie = name + "=" + value + expires + "; path=/";
    }

    /**
     * Get cookie
     * https://stackoverflow.com/a/1599291
     * @param {string} name 
     */
    function getCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }

        return null;
    }

    /**
     * Remove cookie
     * @see https://stackoverflow.com/a/1599291
     * @param {string} name 
     */
    function eraseCookie(name) {
        createCookie(name, '', -1);
    }


    /****************************************
     *         Table Loader Section
     ****************************************/

    /**
     * Universal table load and update controller
     * @param {*} table: target table element 
     * @param {*} id: table id attribute
     */
    function tableLoader(initial_load, table, id) {
        if (table) {
            if (initial_load || diffMinutes(new Date(), tableLastUpdate) >= options[id].ajax.reloadDelay) {
                loadTable(table, id);
            }
        } else {
            var tables = $('table');

            if (tables.length > 0) {
                tables.forEach(function () {
                    var _this = $(this),
                        id = _this.attr('id');

                    if (initial_load || diffMinutes(new Date(), tableLastUpdate) >= options[id].ajax.reloadDelay) {
                        loadTable(_this, id);
                    }
                });
            } else {
                clearInterval(tableUpdateLoop);
            }
        }
    }

    /**
     * Load the table
     * @param {*} table: target table element 
     * @param {*} id: table id attribute
     */
    function loadTable(table, id) {
        if (options[id].loader) {
            $('.loader').show();
        }

        if (options[id].ajax) {
            var response = ajaxGetTable(id);

            if (response) {
                var tableContent = tableBuilder(response.results, id),
                    newTableHTML = '',
                    pagination = options[id].table.pagination,
                    paginationContent = '',
                    resultsContent = response.pagination.page > 0 ? options[id].table.showingText.replace('#showing#', response.results.length).replace('#total#', response.total_results) : options[id].table.showingNoneText;

                if (pagination && pagination === true) {
                    paginationContent = buildPagination(response.pagination);
                } else if (typeof pagination == 'function') {
                    paginationContent = pagination(response.pagination);
                }

                if (table.parent().attr('id') == 'jqson-table') {
                    table.html(tableContent);
                    table.parent().find('#jqson-footer>#pagination').html(paginationContent);
                    table.parent().find('#jqson-results').html(resultsContent);
                } else {
                    if (paginationContent) {
                        newTableHTML.replace('#pagination#', paginationContent);
                    }

                    if (tableContent) {
                        newTableHTML = '<div id="jqson-table" class="table-responsive jqson-container random-pagination">' +
                            '<div id="jqson-header" class="justify-content-between">' +
                            '<div class="float-right options"><button id="search-on-table" type="button" class="button" title="Search in Table"><i class="fa fa-search"></i></button>' +
                            '<button id="refresh-table" type="button" class="button" title="Reload Table Contents"> <i class="fa fa-sync"></i> </button></div>' +
                            '<div id="jqson-search" class="row m-0 d-none"><div class="col-lg-11"><input id="table-search" type="search" class="form-control rounded-input" placeholder="Search"></div><div class="col-lg-1"><button id="table-search-button" type="button" class="btn btn-primary btn-rounded">Search</button></div></div>' +
                            '</div><br>' +
                            table[0].outerHTML.replace('</table>', tableContent + '</table>') +
                            '<div id="jqson-footer" class="row justify-content-between align-items-baseline" style="margin: 0px; padding: 0px 10px;"><div id="pagination" class="pagination">' +
                            paginationContent +
                            '</div><div id="jqson-results">' + (resultsContent) + '</div></div></div>';

                        table.parent().html(newTableHTML);
                    }
                }

                $('.loader').hide();
            } else {
                console.log('There is no data.');
            }
        } else {
            console.log('Missing AJAX');
        }
    }

    /**
     * Load the table from source
     * @param {*} data
     * @param {*} table: target table element 
     * @param {*} id: table id attribute
     */
    function loadTableData(data, table, id) {
        if (data) {
            var tableContent = tableBuilder(data.results, id),
                newTableHTML = '',
                pagination = options[id].table.pagination,
                paginationContent = '',
                resultsContent = data.pagination.page > 0 ? options[id].table.showingText.replace('#showing#', data.results.length).replace('#total#', data.total_results) : options[id].table.showingNoneText;

            if (pagination && pagination === true) {
                paginationContent = buildPagination(data.pagination);
            } else if (typeof pagination == 'function') {
                paginationContent = pagination(data.pagination);
            }

            if (table.parent().attr('id') == 'jqson-table') {
                table.html(tableContent);
                table.parent().find('#jqson-footer>#pagination').html(paginationContent);
                table.parent().find('#jqson-results').html(resultsContent);
            } else {
                if (paginationContent) {
                    newTableHTML.replace('#pagination#', paginationContent);
                }

                if (tableContent) {
                    newTableHTML = '<div id="jqson-table" class="table-responsive jqson-container random-pagination">' +
                        '<div id="jqson-header" class="justify-content-between">' +
                        '<div class="float-right options"><button id="search-on-table" type="button" class="button" title="Search in Table"><i class="fa fa-search"></i></button>' +
                        '<button id="refresh-table" type="button" class="button" title="Reload Table Contents"> <i class="fa fa-sync"></i> </button></div>' +
                        '<div id="jqson-search" class="row m-0 d-none"><div class="col-lg-11"><input id="table-search" type="search" class="form-control rounded-input" placeholder="Search"></div><div class="col-lg-1"><button id="table-search-button" type="button" class="btn btn-primary btn-rounded">Search</button></div></div>' +
                        '</div><br>' +
                        table[0].outerHTML.replace('</table>', tableContent + '</table>') +
                        '<div id="jqson-footer" class="row justify-content-between align-items-baseline" style="margin: 0px; padding: 0px 10px;"><div id="pagination" class="pagination">' +
                        paginationContent +
                        '</div><div id="jqson-results">' + (resultsContent) + '</div></div></div>';

                    table.parent().html(newTableHTML);
                }
            }

            $('.loader').hide();
        } else {
            console.log('There is no data.');
        }
    }

    /**
     * pagination builder
     * 
     * @param {*} page: current page
     * @param {*} start: start page list of pages
     * @param {*} end:  end page list of pages
     * @param {*} last: last page
     */
    function buildPagination(pagination) {
        if (pagination.last == 0 || pagination.last == 1) {
            return '';
        }

        var paginationHtml = '';

        // << previous page
        if (pagination.page != 1) {
            paginationHtml = '<button data-index="' + (pagination.page - 1) + '" class="btn btn-default">&laquo;</button>';
        } else {
            paginationHtml = '<button data-index="' + pagination.start + '" class="btn btn-default"" disabled>&laquo;</button>';
        }

        // first page and dot dot dot
        if (pagination.page > 7) {
            paginationHtml += '<button data-index="1" class="btn btn-default">1</button>';

            paginationHtml += '<button class="btn btn-default" disabled>•••</button>';
        }


        // left pages
        if (pagination.left) {
            pagination.left.forEach(el => {
                paginationHtml += '<button data-index="' + el + '" class="btn btn-default">' + el + '</button>';
            });
        }

        // current page
        paginationHtml += '<button data-index="' + pagination.page + '" class="btn btn-default active">' + pagination.page + '</button>';

        // right pages
        if (pagination.right) {
            pagination.right.forEach(el => {
                paginationHtml += '<button data-index="' + el + '" class="btn btn-default">' + el + '</button>';
            });
        }

        // last page or dot dot dot
        if (pagination.end < pagination.last) {
            if ((pagination.last - pagination.page) > 10) {
                paginationHtml += '<button class="btn btn-default" disabled>•••</button>';
            }

            paginationHtml += '<button data-index="' + pagination.last + '" class="btn btn-default">' + pagination.last + '</button>';
        }

        // >> next page
        if (pagination.page != pagination.end) {
            paginationHtml += '<button data-index="' + (pagination.page + 1) + '" class="btn btn-default"">&raquo;</button>';
        } else {
            paginationHtml += '<button data-index="' + pagination.end + '" class="btn btn-default" disabled>&raquo;</button>';
        }

        return paginationHtml;
    }

    /**
     * 
     * @param {*} results 
     * @param {*} id 
     */
    function tableBuilder(results, id) {
        var thead = '',
            tbody = '',
            tfoot = '';

        if (results && results[0]) {
            // thead
            thead = '<thead><tr>'

            if (options[id].table.numbers && language) {
                thead += '<th>' + language.num + '</th>';
            } else if (options[id].table.numbers && !language) {
                thead += '<th>' + options[id].table.numText + '</th>';
            }

            if (options[id].table.columns && options[id].table.columns.length) {
                options[id].table.columns.forEach(function (value, key) {
                    if (options[id].table.except.indexOf(value.text) === -1) {
                        thead += setThead(value.href, value.text, id);
                    }
                });
            } else {
                if (typeof results[0] === 'object') {

                    for (var key in results[0]) {
                        if (options[id].table.except.indexOf(key) === -1) {
                            thead += setThead(key, key, id);
                        }
                    }
                }
            }

            if (options[id].table.actions && language) {
                thead += '<th>' + language.actions + '</th>';
            } else if (options[id].table.actions && !language) {
                thead += '<th>' + options[id].table.actionsText + '</th>';
            }

            thead += '</tr></thead>';

            // tbody
            if (typeof results === 'object') {
                tbody = '<tbody>';

                for (var key in results) {
                    tbody += setTableRow(key, results[key], id);
                }

                tbody += '</tbody>';
            }

            // tfoot
            if (options[id].table.tfoot) {
                tfoot = thead.replace('thead', 'tfoot');
            }
        }

        return thead + tbody + tfoot;
    }

    /**
     * Build table head / column titles
     * 
     * @param {*} href: #order_string
     * @param {*} text: column title
     * @param {*} id: table id
     */
    function setThead(href, text, id) {
        var thead = '<th>{{{text}}}</th>';

        if (options[id].table.headerOrder && href) {
            thead = thead.replace('{{{text}}}', '<a href="#' + href + '">{{{text}}}</a>');
        }

        if (language && language[text]) {
            thead = thead.replace('{{{text}}}', language[text]);
        } else {
            thead = thead.replace('{{{text}}}', text.replace('_', ' '));
        }

        return thead;
    }

    /**
     * Build table row
     * 
     * @param {*} key: item index
     * @param {*} value: ta array for row
     * @param {*} id: table id
     */
    function setTableRow(key, value, id) {
        var tr = options[id].table.rowTr ? options[id].table.rowTr(key, value) : (value.id ? 'data-id="' + value.id + '"' : ''),
            trow = '<tr ' + tr + '>{{{row}}}</tr>',
            rowContent = '';

        if (options[id].table.numbers) {
            rowContent += '<td class="font-weight-bold">#' +
                (((options[id].pagination.page * options[id].pagination.limit) - options[id].pagination.limit) + parseInt(key) + 1) +
                '</td>';
        }

        if (typeof value === 'object') {
            for (var key in value) {
                if (options[id].table.except.indexOf(key) === -1) {
                    if (options[id].table.rowItem) {
                        var rowItem = options[id].table.rowItem(key, value);

                        rowContent += '<td>' + (rowItem ? rowItem : value[key]) + '</td>';
                    } else {
                        rowContent += '<td>' + value[key] + '</td>';
                    }
                }
            }
        }

        if (options[id].table.actions) {
            rowContent += '<td><div class="btn-group dropleft">' +
                '<button type="button" class="btn btn-md btn-' + (options[id].table.actionColor ? options[id].table.actionColor : 'primary') + ' dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
                (language && language.actions ? language.actions : options[id].table.actionsText) +
                '</button>' +
                '<div class="dropdown-menu">';

            options[id].table.actions.forEach(function (_value, _key) {
                if (_value.actionItem) {
                    var actionItem = _value.actionItem(key, value);
                    rowContent += actionItem;
                } else {
                    rowContent +=
                        '<button data-action="' + _value.action + '" class="dropdown-item dropdown-item-blue" type="button"><i class="' + _value.icon + '"></i>' +
                        (language ? language[_value.text] : _value.text) +
                        '</button>';
                }
            });

            rowContent += '</div>' +
                '</div></td>';
        }

        return trow.replace('{{{row}}}', rowContent);
    }

    /**
     * Table column order action
     */
    $(document).on('click', '.jqson-table thead th a, .jqson-table tfoot th a', function (e) {
        e.preventDefault();

        var _this = $(this),
            order_by = _this.attr('href').replace('#', ''),
            order = _this.attr('data-order'),
            table = _this.parents('.jqson-table'),
            id = table.attr('id');

        options[id].pagination.order = options[id].pagination.order === 'desc' ? 'asc' : 'desc';
        options[id].pagination.order_by = order_by;

        if (order === undefined || order == 'desc') {
            tableLoader(true, table, id);

            var item = $('a[href="#' + order_by + '"]');
            item.attr('data-order', 'asc').html(item[0].innerText + ' <i class="fas fa-angle-double-up"></i>');
        } else if (order == 'asc') {
            tableLoader(true, table, id);

            var item = $('a[href="#' + order_by + '"]');
            item.attr('data-order', 'desc').html(item[0].innerText + ' <i class="fas fa-angle-double-down"></i>');
        }
    });

    /**
     * Table pagination action
     */
    $(document).on('click', '#pagination button', function () {
        var _this = $(this),
            table = _this.parents('#jqson-table').find('.jqson-table'),
            id = table.attr('id'),
            index = _this.attr('data-index');

        options[id].pagination.page = index;
        tableLoader(true, table, id);

        if (options[id].table.paginationHistory) {
            setCookie(options[id].table.prefix + id + '_pagination', JSON.stringify(options[id].pagination), 365);
        }
    });

    /**
     * Open search bar
     */
    $(document).on('click', '#search-on-table', function () {
        var searchBar = $('#jqson-search');

        console.log(searchBar);
        if (searchBar.hasClass('d-none')) {
            searchBar.removeClass('d-none');
        } else {
            searchBar.addClass('d-none');
        }
    });

    /**
     * Search on table
     */
    function searchOnTable(_this) {
        var table = $(_this).parents('#jqson-table').find('table'),
            id = table.attr('id'),
            searchTerm = $('#table-search').val() ? $('#table-search').val() : '';

        if (id) {
            options[id].pagination.like = searchTerm;

            loadTable(table, id);

            options[id].pagination.like = '';
            setCookie(options[id].table.prefix + id + '_pagination', JSON.stringify(options[id].pagination), 365);
        }
    }

    /**
     * Search on table with button click action
     */
    $(document).on('click', '#table-search-button', function () {
        searchOnTable(this);
    });

    /**
     * Search on table when focus lost
     */
    $(document).on('blur', '#table-search', function (e) {
        searchOnTable(this);
    });

    /**
     * Search on table when focus lost
     */
    $(document).on('search', '#table-search', function (e) {
        searchOnTable(this);
    });

    /**
     * Refresh table
     */
    $(document).on('click', '#refresh-table', function () {
        var table = $(this).parents('#jqson-table').find('table'),
            id = table.attr('id');

        options[id].pagination.like = '';
        options[id].pagination.page = 1;

        loadTable(table, id);
    });


    /****************************************
     *        Option Loader Section
     ****************************************/

    /**
     * 
     * @param {*} results 
     * @param {*} id 
     */
    function optionBuilder(results, id) {
        var optionsHtml = '';

        if (options[id].defaultOption) {
            optionsHtml += options[id].defaultOption;
        }

        if (results && options[id].optionItem) {
            if (typeof results[0] === 'object') {
                for (var key in results) {
                    var option = options[id].optionItem(key, results[key], options[id].selectedValue);

                    optionsHtml += option;
                }

                return optionsHtml;
            }
        }
    }

    /**
     * Load the select
     * @param {*} select: target select element 
     * @param {*} id: select id attribute
     */
    function loadSelect(select, id) {
        if (options[id].ajax) {
            // get json data with ajax get request
            var response = ajaxGetSelect(id);

            if (response) {
                // build the select with data
                var optionHtml = optionBuilder(response.results, id);
                select.html(optionHtml);
            } else {
                console.log('There is no data.');
            }
        } else {
            // ###
        }
    }


    /****************************************
     *          Extension Methods
     ****************************************/

    /**
     * JSON to table
     */
    $.fn.jqSonTable = function (customOptions) {
        var _this = $(this);

        if (_this.length) {
            var id = _this.attr('id'),
                prefix = _this.attr('data-table-prefix');

            if (customOptions) {
                options[id] = $.extend(true, {}, tableDefaultOptions, customOptions);
            }

            if (!options[id].table.prefix.length && prefix) {
                options[id].table.prefix = prefix;
            }

            if (options[id].table.paginationHistory && prefix) {
                var paginationHistory = getCookie(prefix + id + '_pagination');

                if (paginationHistory) {
                    options[id].pagination = JSON.parse(paginationHistory);
                }
            }

            tableLoader(true, _this, id);
        }
    };

    /**
     * Load table from source
     */
    $.fn.jqSonTableLoadData = function (data, customOptions) {
        var _this = $(this);

        if (_this.length) {
            var id = _this.attr('id'),
                prefix = _this.attr('data-table-prefix');

            if (customOptions) {
                options[id] = $.extend(true, {}, tableDefaultOptions, customOptions);
            }

            if (!options[id].table.prefix.length && prefix) {
                options[id].table.prefix = prefix;
            }

            if (options[id].table.paginationHistory && prefix) {
                var paginationHistory = getCookie(prefix + id + '_pagination');

                if (paginationHistory) {
                    options[id].pagination = JSON.parse(paginationHistory);
                }
            }

            loadTableData(data, _this, id);
        }
    };

    /**
     * JSON to select/option
     */
    $.fn.jqSonSelect = function (customOptions) {
        var _this = $(this);

        if (_this.length) {
            var id = _this.attr('id');

            if (customOptions) {
                options[id] = $.extend(true, {}, selectDefaultOptions, customOptions);
            }

            loadSelect(_this, id);
        }
    };

    /**
     * Reload table action
     */
    $.fn.jqSonTableReload = function () {
        tableLoader(true, $(this));
    };

    /**
     * Set default options
     */
    $.jqSonTableOptions = function (customOptions) {
        if (customOptions) {
            $.extend(true, tableDefaultOptions, customOptions);
        }

        return this;
    };

    /**
     * Set language
     */
    $.jqSonLoadLang = function (lang) {
        if (lang) {
            language = lang;
        }
    };

    /**
     * Initalize auto detect and run script
     */
    $.jqSonInit = function () {
        tableLoader(true);
    }
})(jQuery);
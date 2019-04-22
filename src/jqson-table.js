(function ($) {
    'use strict';

    var ajaxGetTable,
        printError,
        jsonEqual,
        diffMinutes,
        loadTable;

    var timeOutMaxRetry = 10,
        timeOutCurrentRetry,
        previousResponse = null,
        tableLastUpdate = new Date(),
        tableUpdateLoop = setInterval(function () {
            tableLoader();
        }, 1000 * 60 * 1);

    var options = [];

    /**
     * Default options
     */
    var defaultOptions = {
        ajax: {
            url: null,
            urlDelimeter: '&',
            timeOut: 30000,
            reloadDelay: 10,
            preventReCreate: false,
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
            order_by: 'date',
            like: ''
        },
        table: {
            search: true,
            limit: true,
            pagination: true,
            numbers: true,
            except: [],
            actions: null,
            actionColor: null,
            columns: [],
            numText: 'Num',
            actionsText: 'Actions'
        },
        loader: '<div class="loader"><div></div><div></div><div></div><div></div></div>',
        language: null
    };

    /**
     * AJAX GET table data
     * @param {*} jqXHR: jquery XHR error log
     * @param {*} textStatus: error status
     * @param {*} errorThrown: error thrown
     */
    ajaxGetTable = function (id) {
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

                _response = response.results;
                window[id]['data'] = response.results;
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
     * AJAX error printer
     * @param {*} jqXHR: jquery XHR error log
     * @param {*} textStatus: error status
     * @param {*} errorThrown: error thrown
     */
    printError = function (jqXHR, textStatus, errorThrown) {
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
     * JSON compare
     * @param {*} json1
     * @param {*} json2
     */
    jsonEqual = function (json1, json2) {
        if (json1 == null || json2 == null) {
            return false;
        }

        return JSON.stringify(json1) === JSON.stringify(json2) ? true : false;
    }

    /**
     * Diff minutes function, require for table load dates
     * @param {*} date1: current time
     * @param {*} date2: past time
     */
    diffMinutes = function (date1, date2) {
        var diff = (date2.getTime() - date1.getTime()) / 1000;
        diff /= 60;

        return Math.abs(Math.round(diff));
    }

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
            var _tables = $('table[id="jqson-table"]');

            if (_tables.length) {
                _tables.forEach(function () {
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
     * pagination builder
     * 
     * @param {*} page: current page
     * @param {*} start: start page list of pages
     * @param {*} end:  end page list of pages
     * @param {*} last: last page
     */
    function getPagination(page, start, end, last) {
        if (last == 1) {
            return '';
        }

        var pagination = '';

        // left arrow: goes to previous page
        if (page != 1) {
            pagination = '<button data-index="' + (page - 1) + '" class="btn btn-default">&laquo;</button>';
        } else {
            pagination = '<button disabled data-index="' + start + '" class="btn btn-default"">&laquo;</button>';
        }

        // first page
        if (start > 1) {
            pagination += '<button data-index="1" class="btn btn-default">1</button>';
            if (start > 6) {
                pagination += '<button class="btn btn-default">...</button>';
            }
        }

        // middle pages
        for (var i = 0; i < last-1; i++) {
            var _page = start+i;

            if (i <= 10) {
                if (_page == page) {
                    pagination += '<button data-index="' + _page + '" class="btn btn-default active">' + _page + '</button>';
                } else if (_page != last){
                    pagination += '<button data-index="' + _page + '" class="btn btn-default"">' + _page + '</button>';
                }
            }
        }

        // last page or dot dot dot
        if (end < last) {
            if ((last - page) > 10) {
                pagination += '<button class="btn btn-default">...</button>';
            }
            console.log(_page);

            pagination += '<button data-index="' + last + '" class="btn btn-default">' + last + '</button>';
        }

        // right arrow: goes to next page
        if (end != last) {
            pagination += '<button data-index="' + (page + 1) + '" class="btn btn-default"">&raquo;</button>';
        } else {
            pagination += '<button data-index="' + page + '" class="btn btn-default active">' + page + '</button>';
            pagination += '<button disabled data-index="' + last + '" class="btn btn-default">&raquo;</button>';
        }

        return pagination;
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

        if (href) {
            thead = thead.replace('{{{text}}}', '<a href="#' + href + '">{{{text}}}</a>');
        }

        if (options[id].language && options[id].language[text]) {
            thead = thead.replace('{{{text}}}', options[id].language[text]);
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
        var trow = '<tr' + (value.id ? ' data-id="' + value.id + '"' : '') + '>{{{row}}}</tr>',
            rowContent = '';

        if (options[id].table.numbers) {
            rowContent += '<td class="font-weight-bold">#' +
                (((options[id].pagination.page * options[id].pagination.limit) - options[id].pagination.limit) + parseInt(key) + 1) +
                '</td>';
        }

        if (typeof value === 'object') {
            for (var key in value) {
                if (options[id].table.except.indexOf(key) === -1 && typeof value[key] === 'string') {
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
                (options[id].language && options[id].language.actions ? options[id].language.actions : options[id].table.actionsText) +
                '</button>' +
                '<div class="dropdown-menu">';

            options[id].table.actions.forEach(function (_value, _key) {
                if (_value.actionItem){
                    var actionItem = _value.actionItem(key, value);
                    rowContent += actionItem;
                } else {
                    rowContent +=
                    '<button data-action="' + _value.action + '" class="dropdown-item dropdown-item-blue" type="button"><i class="' + _value.icon + '"></i>' +
                    (options[id].language ? options[id].language[_value.text] : _value.text) +
                    '</button>';
                }
            });

            rowContent += '</div>' +
                '</div></td>';
        }

        return trow.replace('{{{row}}}', rowContent);
    }

    /**
     * 
     * @param {*} results 
     * @param {*} id 
     */
    function tableBuilder(results, id) {
        var table = '<thead><tr>';

        if (results && results[0]) {
            if (options[id].table.numbers && options[id].language) {
                table += '<th>' + options[id].language.num + '</th>';
            } else if (options[id].table.numbers && !options[id].language) {
                table += '<th>' + options[id].table.numText + '</th>';
            }

            if (options[id].table.columns && options[id].table.columns.length) {
                options[id].table.columns.forEach(function (value, key) {
                    if (options[id].table.except.indexOf(value.text) === -1 && typeof value.text === 'string') {
                        table += setThead(value.href, value.text, id);
                    }
                });
            } else {
                if (typeof results[0] === 'object') {

                    for (var key in results[0]) {
                        if (options[id].table.except.indexOf(key) === -1 && typeof results[0][key] === 'string') {
                            table += setThead(key, key, id);
                        }
                    }
                }
            }

            if (options[id].table.actions && options[id].language) {
                table += '<th>' + options[id].language.actions + '</th>';
            } else if (options[id].table.actions && !options[id].language) {
                table += '<th>' + options[id].table.actionsText + '</th>';
            }

            table += '</tr></thead><tbody>'

            if (typeof results === 'object') {
                for (var key in results) {
                    table += setTableRow(key, results[key], id);
                }
            }
        }
        return table + '</tbody>';
    }

    /**
     * Table column order action
     */
    $(document).on('click', '.jqson-table thead th a', function (e) {
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

            var head = $('a[href="#' + order_by + '"]');
            head.attr('data-order', 'asc').html(head.text() + ' <i class="fas fa-angle-double-up"></i>');
        } else if (order == 'asc') {
            tableLoader(true, table, id);

            var head = $('a[href="#' + order_by + '"]');
            head.attr('data-order', 'desc').html(head.text() + ' <i class="fas fa-angle-double-down"></i>');
        }
    });

    /**
     * Table pagination action
     */
    $(document).on('click', '#pagination button', function () {
        var _this = $(this),
            table = _this.parents('#jqson-table').find('.jqson-table'),
            id = table.attr('id');

        options[id].pagination.page = _this.attr('data-index');
        tableLoader(true, table, id);
    });

    /**
     * Load the table
     * @param {*} table: target table element 
     * @param {*} id: table id attribute
     */
    loadTable = function (table, id) {
        if (options[id].ajax) {
            // get json data with ajax get request
            var response = ajaxGetTable(id);

            if (response) {
                if (options[id].ajax.preventReCreate && !jsonEqual(previousResponse, response)) { // ###
                    table.html(options[id].loader);

                    // build the table with data
                    var tableHtml = tableBuilder(response, id);
                    table.html(tableHtml);
                        
                    if (options[id].table.pagination){
                        var pagination =  getPagination(response.page, response.start, response.end, response.last);
                        table.next('.pagination').html(pagination);    
                    }

                    previousResponse = response;
                } else if (!options[id].ajax.preventReCreate) {
                    // build the table with data
                    table.html(options[id].loader);

                    var tableHtml = tableBuilder(response, id);
                    table.html(tableHtml);

                    var pagination =  getPagination(response.page, response.start, response.end, response.last);
                    table.next('.pagination').html(pagination);
                }
            } else {
                console.log('There is no data.');
            }
        } else {
            // ###
        }
    }

    /**
     * JSON to table
     */
    $.fn.jqSonTable = function (customOptions) {
        var _this = $(this);

        if (_this.length) {
            var id = _this.attr('id');

            if (customOptions) {
                options[id] = $.extend(true, {}, defaultOptions, customOptions);
            }

            tableLoader(true, _this, id);
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
            $.extend(true, options, customOptions);
        }

        return this;
    };

    /**
     * Initalize auto detect and run script
     */
    $.jqSonInit = function () {
        tableLoader(true);
    }
})(jQuery);
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

    var options = {
        ajax: {
            url: null,
            baseUrl: null,
            urlDelimeter: '&',
            subUrl: null,
            timeOut: 30000,
            reloadDelay: 10,
            preventReCreate: true,
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
            like: '',
            total: null
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

    ajaxGetTable = function () {
        var _response = null,
            url = options.ajax.url ? options.ajax.url : options.ajax.baseUrl + options.ajax.subUrl + options.ajax.urlDelimeter + $.param(options.pagination);

        $.ajax({
            url: url,
            type: 'GET',
            timeOut: options.ajax.timeOut,
            dataType: 'json',
            async: options.ajax.async,
            beforeSend: function (request) {
                if (options.ajax.beforeSend) {
                    options.ajax.beforeSend(request);
                }
            },
            success: function (response) {
                if (options.ajax.successCallback) {
                    options.ajax.successCallback(response);
                }

                _response = response;
            },
            error: function (jqXHR, textStatus, errorThrown) {
                if (options.ajax.logError) {
                    printError(jqXHR, textStatus, errorThrown);
                }

                if (options.ajax.errorCallback) {
                    options.ajax.errorCallback(jqXHR, textStatus, errorThrown);
                }

                if (textStatus == 'timeout' && timeOutMaxRetry < timeOutCurrentRetry) {
                    ++timeOutCurrentRetry;
                    return getTable();
                }
            }
        });

        return _response;
    };

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

    jsonEqual = function (json1, json2) {
        if (json1 == null || json2 == null) {
            return false;
        }

        return JSON.stringify(json1) === JSON.stringify(json2) ? true : false;
    }

    diffMinutes = function (date1, date2) {
        var diff = (date2.getTime() - date1.getTime()) / 1000;
        diff /= 60;

        return Math.abs(Math.round(diff));
    }

    function setThead(href, text) {
        var thead = '<th>{{{text}}}</th>';

        if (href) {
            thead = thead.replace('{{{text}}}', '<a href="#' + href + '">{{{text}}}</a>');
        }

        if (options.language && options.language[text]) {
            thead = thead.replace('{{{text}}}', options.language[text]);
        } else {
            thead = thead.replace('{{{text}}}', text.replace('_', ' '));
        }

        return thead;
    }

    function setTableRow(key, value) {
        var trow = '<tr' + (value.id ? ' data-id="' + value.id + '"' : '') + '>{{{row}}}</tr>',
            rowContent = '';

        if (options.table.numbers) {
            rowContent += '<td class="font-weight-bold">#' +
                (((options.pagination.page * options.pagination.limit) - options.pagination.limit) + key + 1) +
                '</td>';
        }

        if (typeof value === 'object') {
            for (var key in value) {
                if (options.table.except.indexOf(key) === -1 && typeof value[key] === 'string') {
                    if (options.table.rowItem) {
                        var rowItem = options.table.rowItem(key, value);

                        rowContent += '<td>' + (rowItem ? rowItem : value[key]) + '</td>';
                    }
                }
            }
        }

        if (options.table.actions) {
            rowContent += '<td><div class="btn-group dropleft">' +
                '<button type="button" class="btn btn-md btn-' + (options.table.actionColor ? options.table.actionColor : 'primary') + ' dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
                (options.language && options.language.actions ? options.language.actions : options.table.actionsText) +
                '</button>' +
                '<div class="dropdown-menu">';

            options.table.actions.forEach(function (value, key) {
                rowContent +=
                    '<button data-action="' + value.action + '" class="dropdown-item dropdown-item-red" type="button"><i class="' + value.icon + '"></i>' +
                    (options.language ? options.language[value.text] : value.text) +
                    '</button>';
            });

            rowContent += '</div>' +
                '</div></td>';
        }

        return trow.replace('{{{row}}}', rowContent);
    }

    function tableBuilder(response) {
        var table = '<thead><tr>';

        if (response && response.results) {
            if (response.results[0]) {
                if (options.table.numbers && options.language) {
                    table += '<th>' + options.language.num + '</th>';
                } else if (options.table.numbers && !options.language) {
                    table += '<th>' + options.table.numText + '</th>';
                }

                if (options.table.columns) {
                    options.table.columns.forEach(function (value, key) {
                        if (options.table.except.indexOf(value.text) === -1 && typeof value.text === 'string') {
                            table += setThead(value.href, value.text);
                        }
                    });
                } else {
                    response.results[0].forEach(function (value, key) {
                        if (options.table.except.indexOf(key) === -1 && typeof value === 'string') {
                            table += setThead(key, key);
                        }
                    });
                }

                if (options.table.numbers && options.language) {
                    table += '<th>' + options.language.actions + '</th>';
                } else if (options.table.numbers && !options.language) {
                    table += '<th>' + options.table.actionsText + '</th>';
                }
            }

            table += '</tr></thead><tbody>'

            response.results.forEach(function (value, key) {
                table += setTableRow(key, value);
            });
        }
        return table + '</tbody>';
    }

    /**
     * pagination builder
     * 
     * @param {*} page current page
     * @param {*} start start page list of pages
     * @param {*} end  end page list of pages
     * @param {*} last last page
     */
    function getPagination(page, start, end, last) {
        if (last == 1) {
            return '';
        }

        var pagination = '';

        // left arrow: goes to previous page
        if (page != 1) {
            pagination = '<button data-index="' + (page - 1) + '" class="btn btn-default" title="' + lang.ui_go_to_page + ((page - 1)) + '">&laquo;</button>';
        } else {
            pagination = '<button disabled data-index="' + start + '" class="btn btn-default" title="' + lang.ui_you_are1 + '">&laquo;</button>';
        }

        // first page
        if (start > 1) {
            pagination += '<button data-index="1" class="btn btn-default" title="' + lang.ui_page + (start) + '">1</button>';
            if (start > 6) {
                pagination += '<button class="btn btn-default">...</button>';
            }
        }

        // middle pages
        for (var i = start; i < last; i++) {
            if (i <= 10) {
                if (page == i) {
                    pagination += '<button data-index="' + i + '" class="btn btn-default active" title="' + lang.ui_page + (i) + '">' + i + '</button>';
                } else if (i > 0) {
                    pagination += '<button data-index="' + i + '" class="btn btn-default" title="' + lang.ui_page + (i) + '">' + i + '</button>';
                }
            }
        }

        // last page or dot dot dot
        if (end < last) {
            if ((last - page) > 5) {
                pagination += '<button class="btn btn-default">...</button>';
            }

            pagination += '<button data-index="' + last + '" class="btn btn-default" title="' + lang.ui_page + (last) + '">' + last + '</button>';
        }

        // right arrow: goes to next page
        if (end != last) {
            pagination += '<button data-index="' + (page + 1) + '" class="btn btn-default" title="' + lang.ui_go_to_page + (page + 1) + '">&raquo;</button>';
        } else {
            pagination += '<button data-index="' + page + '" class="btn btn-default active" title="' + lang.ui_page + (page) + '">' + i + '</button>';
            pagination += '<button disabled data-index="' + last + '" class="btn btn-default" title="' + lang.ui_you_are2 + '">&raquo;</button>';
        }

        return pagination;
    }

    /**
     * Universal table load and update controller function
     * 
     */
    function tableLoader(initial_load, table) {
        if (initial_load || diffMinutes(new Date(), tableLastUpdate) >= options.ajax.reloadDelay) {
            if (table) {
                loadTable(table);
            } else {
                var _tables = $('table[id="jqson-table"]');

                if (_tables.length) {
                    _tables.forEach(function (value, key) {
                        loadTable($(this));
                    });
                } else {
                    clearInterval(tableUpdateLoop);
                }
            }
        }
    }

    $(document).on('click', '.jqson-table thead th a', function (e) {
        e.preventDefault();

        var _order_by = $(this).attr('href'),
            _order = $(this).attr('data-order');
        order_by = _order_by.replace('#', '');

        if (_order === undefined || _order == 'desc') {
            tableLoader(true);

            var _head = $('a[href="' + _order_by + '"]');
            _head.attr('data-order', 'asc').html(_head.text() + ' <i class="fas fa-angle-double-up"></i>');
        } else if (_order == 'asc') {
            tableLoader(true);

            var _head = $('a[href="' + _order_by + '"]');
            _head.attr('data-order', 'desc').html(_head.text() + ' <i class="fas fa-angle-double-down"></i>');
        }
    });

    loadTable = function (table) {
        if (options.ajax && options.ajax.baseUrl) {
            options.ajax.subUrl = table.attr('data-path')
            var response = ajaxGetTable();

            if (response) {
                if (options.ajax.preventReCreate && !jsonEqual(previousResponse, response)) {
                    table.html(options.loader);

                    var tableHtml = tableBuilder(response);
                    setTimeout(() => {
                        table.html(tableHtml);
                    }, 200);

                    previousResponse = response;
                } else if (!options.ajax.preventReCreate) {
                    table.html(options.loader);

                    var tableHtml = tableBuilder(response);
                    table.html(tableHtml);
                }
            }
        }
    }

    $.fn.jqSonTable = function (customOptions) {
        if (customOptions) {
            $.extend(true, options, customOptions);
        }

        tableLoader(true, $(this));
    };

    $.jqSonTableOptions = function (customOptions) {
        if (customOptions) {
            $.extend(true, options, customOptions);
        }

        return this;
    };

    $.jqSonInit = function () {
        tableLoader(true);
    }
})(jQuery);
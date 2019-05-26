#
JqSONTable
Dynamic and customizable json to table jquery plugin

## Available Features ✨
    
* JSON to Table
* to Select
* to List
* to ...

## Available Languages 📖 

* [English](README.md)
* [Türkçe](README_tr-TR.md)

## Requirements 🔨

* [Jquery](https://jquery.com/)
* [Bootstrap](https://getbootstrap.com/)
* [Font Awesome](https://fontawesome.com/)

This Jquery plugin uses some `Font Awesome` icons and `Bootstrap` classes.

#JSON to Table  📍 

## Base JSON structure
Table extension can only process the following json structure.The main parts of json tree is ** pagination ** , ** total_resuls ** (paginated items count) and ** results ** content.

```json
{
    "pagination": {
        "left": [],
        "right": [2, 3, 4, 5],
        "page": 1,
        "start": 1,
        "end": 5,
        "last": 4
    },
    "total_results": 2,
    "results": [{
        "column1": "column1",
        "column2": "column2",
        "column3": "column3",
        "column...": "column..."
    }, {
        "column1": "column1",
        "column2": "column2",
        "column3": "column3",
        "column...": "column..."
    }]
}
```

**Q: How can I calculate this pagination content ?** \
**A:** Actually it is quite simple, just check the following example and apply to your project.

```php
/**
 * Pagination function
 *
 * @param array $data: results of query
 * @param int $page: selected page number
 * @param int $limit: selected items for page of limit
 * @param int $pages: left and right pages count
 * @return array
 */
public function pagination($data, $page, $limit, $pages = 6)
{
    if ($data){
        $pagedArray = array_chunk($data, $limit, true);
        $nthPage = [];
        $page = (int)$page;
        $totalPages = count($pagedArray);

        if (isset($pagedArray[$page])){
            $nthPage = $pagedArray[$page - 1];
        } else {
            $page = $totalPages;
            $nthPage = end($pagedArray);
        }

        $leftPages = [];
        $rightPages = [];

        for ($i=0; $i < $pages; $i++) { 
            if ($page != $page - $i && $page - $i > 0){
                array_push($leftPages, $page - $i);
            }

            if ($page != $page + $i && $page + $i < $pages){
                array_push($rightPages, $page + $i);
            }
        }
    
        return [
            'pagination' => [
                'left' => array_reverse($leftPages),
                'right' => $rightPages,
                'page' => $page,
                'start' => $page > $pages ? $page - 5 : 1,
                'end' => $pages - 1,
                'last' => $totalPages - 1 != 0 ? $totalPages - 1 : 1
            ],
            'total_results' => count($data),
            'results' => $nthPage ? array_values($nthPage): []
        ];
    } else {
        return [
            'pagination' => [
                'left' => [],
                'right' => [],
                'page' => 0,
                'start' => 0,
                'end' => 0,
                'last' => 0
            ],
            'total_results' => '0',
            'results' => []
        ];
    }
}
```

And then plugin automatically builds the pagination buttons.

# Quick Examples

## Set global options
```javascript
$.jqSonTableOptions({
    ajax: {
        reloadDelay: 10,
        beforeSend: function (request) {
            request.setRequestHeader('session_token', getCookie('session_token'));
        }
    },
    pagination:{
        order: 'asc',
        order_by: 'date'
    },
    table: {
        numText: 'Order Numbers',
        actionsText: 'My Awesome Actions',
    }
});
```

## Get Table

Get table via AJAX;

```javascript
$('#url_groups_table').jqSonTable({
    ajax: {
        url: '/api/1.0/' + 'users/list'
    }
});
```

With parameters:

```javascript
$('#url_groups_table').jqSonTable({
    ajax: {
        url: '/api/1.0/' + 'users/list'
    },
    table: {
        paginationHistory: false,
        numText: 'Numbers',
        actionsText: 'My Brilliant Actions',
        ...
    }
});
```

### Default options

```javascript
/**
 * Default table options
 */
var tableDefaultOptions = {
    ajax: {
        url: null,
        urlDelimeter: '?',
        timeOut: 30000,
        reloadDelay: 10, // in minutes
        async: false,
        beforeSend: null,
        afterSend: null,
        successCallback: null,
        errorCallback: null,
        logError: true
    },
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
        actionColor: 'primary',
        columns: [],
        numText: 'Num',
        actionsText: 'Actions',
        showingText: 'Showing #showing# of #total# items.',
        showingNoneText: 'There is no reuslt',
        tfoot: true
    }
};
```
### AJAX Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| url | string | Request page URL |
| urlDelimeter | string | Uses with GET paramters, eg: /api/1.0/users/list<strong>?</strong>some=param |
| timeOut | int | Request timeout, in miliseconds |
| reloadDelay | int | Replay the previous request, in minutes |
| async | bool | AJAX async request option |
| beforeSend | function | Run any function before send |
| afterSend | function | Run any function when finished request done |
| success | function | Success callback option |
| error | function | Error callback option |
| logError | bool | Prints error log |

### Pagination Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| page | int | Current page number |
| limit | int | Limit for every page items |
| order | string | Excepting 'ASC', 'DESC' |
| order_by | string | Order by with column |
| like | string | Search terms |

### Table Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| headerOrder | bool | Order by option for column titles |
| search | bool | Enable search bar and button |
| limit | bool | Enable page limit bar |
| pagination | bool | Enable pagination buttons |
| rowItem | function | Gets item value and key, it is useful formatting table row item |
| rowTr | function | Gets item value and key, it is useful formatting table column item |
| paginationHistory | bool | Enable pagination history (with cookie) |
| numbers | bool | Enable number column |
| except | array | Except some item when listing |
| **actions** | array | Custom action items|
| actionColor | string | Bootstrap btn-* color |
| columns | array | Custom header items/column names |
| numText | string | Numeric listing column title |
| actionsText | string | Actions column title |
| showingText | string | Showing #showing# of #total# items. |
| showingNoneText | string | There is no message text |
| tfoot | bool | Enable table footer |

### Actions Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| actionItem | function | Gets item value and key, it is useful while creating dynamic action items |
| action | string | Action data key |
| icon | string | Action item icon |
| text | string | Action item text |

# JSON to Select  📍 

# JSON to List  📍 
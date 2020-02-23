var moment;
var getCookie;
var loginPrompt;

var logsList;

class Log {
    constructor(id=0,userId=0,userName='', date='', time = '', action='',entity='', data={}) {
        this.id = id;
        this.userId = userId;
        this.date = date;
        this.time = time;
        this.action = action;
        this.entity = entity;
        this.userName = userName;
        this.data = data;
    }

    listHTML() {
        return `<tr>
                    <td scope="row">${this.date}</td>
                    <td>${this.time}</td>
                    <td>${this.userName}</td>
                    <td>${this.action +' '+ this.entity}</td>
                </tr>`;
    }
}

const formHTML = `<form class="form-inline" action="">
                    <span class="input-group-text ml-3" style="height: 38px;"><i class="fa fa-search"></i></span>
                    <input type="search" class="form-control mr-4" placeholder="Search" id="log_search">
                    <div class="ml-2 mr-5">
                        <div class="row">
                            <div class="form-check ml-2">
                                <label for="log_username" class="form-check-label">Usernames:</label>
                                <input type="checkbox" class="form-check ml-2" id="log_username" checked>
                            </div>
                        </div>
                        <div class="row">
                            <div class="form-check ml-2 mr-5">
                                <label for="log_action" class="form-check-label">Actions:</label>
                                <input type="checkbox" class="form-check ml-2" id="log_action">
                            </div>
                        </div>
                    </div>
                    <label for="log_datetime" class="form-label ml-5">Date Range:</label>
                    <div id="log_datetime" class = "ml-2" style="background: #fff; cursor: pointer; padding: 5px 10px; border: 1px solid #ccc;">
                        <i class="fa fa-calendar"></i>
                        <span></span> 
                        <i class="fa fa-caret-down"></i>
                    </div>
                </form><br>`;

async function getLogs() {
    try {
        let authToken = getCookie('authToken');
        /*let srch = '';
        let rname = '';
        let uname = '';
        if (document.getElementById('usr_search') != null) {
            srch = document.getElementById('usr_search').value;
            rname = document.getElementById('usr_names').checked;
            uname = document.getElementById('usr_tags').checked;
        }*/
        let response = await fetch('/api/logs/list?token='+authToken);//+'&search='+srch+'&rname='+rname+'&uname='+uname);
        if (response.ok) {
            let body = await response.text();
            let logData = JSON.parse(body);
            let logs = [];
            for (var i = 0; i < logData.length; i++) {
                let lg = new Log(logData[i].id,logData[i].userId,logData[i].userName,logData[i].date,logData[i].time,logData[i].action,logData[i].entity,logData[i].data);
                logs.push(lg);
            }
            return logs;
        } else if (response.status === 403) {
            alert('Your session may have expired - please log in.');
            loginPrompt();
            return false;
        } else {
            throw new Error(response.status+' '+response.statusText);
        }
    } catch(error) {
        alert(error);
        return false;
    }
}

async function logsClick(event) { //this is the event that triggers when the users tab is clicked on
    event.preventDefault();
    //let logs = [new Log(0,12,'abcd12','2020-20-02','12:46:08','list','sections'),new Log(0,17,'quds38','2020-22-02','19:46:08','login','users')];//await getLogs(100);
    logsList = await getLogs();
    if (logsList) {
        let topHTML = formHTML;
        let logsHTML =  `<table class="table">
                            <thead>
                            <tr>
                                <th scope="col">Date</th>
                                <th scope="col">Time</th>
                                <th scope="col">User</th>
                                <th scope="col">Action</th>
                            </tr>
                            </thead>
                            <tbody id="log_body">`;
        for (var i = 0; i < logsList.length; i++) {
            logsHTML += logsList[i].listHTML();
        }
        logsHTML += '</tbody> </table>';
        document.getElementById('top_content').innerHTML = topHTML;
        document.getElementById('main_content').innerHTML = logsHTML;
        bindDater();
    }
}

function bindDater() {

    var start = moment().subtract(29, 'days');
    var end = moment();

    function cb(start, end) {
        $('#log_datetime span').html(start.format('DD-MM-YY HH:mm') + ' - ' + end.format('DD-MM-YY HH:mm'));
    }

    $('#log_datetime').daterangepicker({
        timePicker: true,
        timePicker24Hour: true,
        startDate: start,
        endDate: end,
        ranges: {
            'Today': [moment(), moment()],
            'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
            'Last 7 Days': [moment().subtract(6, 'days'), moment()],
            'Last 30 Days': [moment().subtract(29, 'days'), moment()],
            'This Month': [moment().startOf('month'), moment().endOf('month')],
            'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
        }
    }, cb);

    cb(start, end);
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('logs').addEventListener('click', logsClick );
});
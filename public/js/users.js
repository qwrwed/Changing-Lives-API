var users;
var currentUser;

var getCookie;
var loginPrompt;
var escapeTags;

class User {
    constructor(id=0,name='',username='',password='', isAdmin = 0) {
        this.id = id;
        this.name = escapeTags(name);
        this.username = escapeTags(username);
        this.password = escapeTags(password);
        this.isAdmin = isAdmin;
    }

    listHTML() {
        let adminText = '';
        if (this.isAdmin) {
            adminText = '<span class="text-info">(Admin) </span>';
        }
        return `<li class="list-group-item"><h4 class="user-list-title">${this.name}</h4> : ${this.username}
                    ${adminText}
                    <span class="badge badge-dark"><a href="#" id="edit_btn_${this.id}" onclick="editUser(event,${this.id});">Edit</a></span>
                    <span class="badge badge-dark"><a href="#" id="rmve_btn_${this.id}" onclick="rmUser(event,${this.id},'${this.name}');">Delete</a></span>
                </li>`;
    }
}

//REST FUNCTIONS

async function rmUser(event, u_id, username) {
    try {
        event.preventDefault();
        if (window.confirm(`Are you sure you want to remove the user: ${username}?`)) {
            let response = await fetch('/api/users/remove',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': getCookie('authToken'),
                    },
                    body: 'userId=' + u_id
                });
            if (response.ok) {
                alert('User deleted successfully!');
                document.getElementById('users').click();
            } else if (response.status === 403){
                alert('Your session may have expired - please log in.');
                loginPrompt();
            } else if (response.status === 400){
                alert('Cannot delete the last admin user!');
            } else {
                throw new Error(response.status+' '+response.statusText);
            }
        }
    } catch(error) {
        alert(error);
        return false;
    }
}

async function getUsers() {
    try {
        let authToken = getCookie('authToken');
        let srch = '';
        let rname = '';
        let uname = '';
        if (document.getElementById('usr_search') != null) {
            srch = document.getElementById('usr_search').value;
            rname = document.getElementById('usr_names').checked;
            uname = document.getElementById('usr_tags').checked;
        }
        let response = await fetch('/api/users/list?token='+authToken+'&search='+srch+'&rname='+rname+'&uname='+uname);
        if (response.ok) {
            let body = await response.text();
            let userData = JSON.parse(body);
            let usrs = [];
            for (var i = 0; i < userData.length; i++) {
                let usr = new User(userData[i].id,userData[i].name,userData[i].username,'',userData[i].isAdmin);
                usrs.push(usr);
            }
            return usrs;
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

async function updateUser(event) {
    event.preventDefault();
    try {
        let authToken = getCookie('authToken');
        let nickname = document.getElementById('user_name').value;
        let response = await fetch('/api/users/edit',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': authToken,
                },
                body: 'nickname=' + nickname + '&userId=' + currentUser
            });
        if (response.ok) {
            document.getElementById('submit_user').style.cursor = '';
            alert('User nickname changed successfully!');
            $('#user_modal').modal('hide');
            document.getElementById('users').click();
            return true;
        } else if (response.status === 403){
            document.getElementById('submit_user').style.cursor = '';
            alert('Your session may have expired - please log in.');
            await loginPrompt();
            $('.modal').modal('hide');
            $('#user_modal').modal('show');
        } else {
            document.getElementById('submit_user').style.cursor = '';
            throw new Error(response.status+' '+response.statusText);
        }
    } catch(error) {
        alert(error);
        return false;
    }
}

async function addUser(event) {
    event.preventDefault();
    try {
        let authToken = getCookie('authToken');
        let userName = document.getElementById('user_name').value;
        let response = await fetch('/api/users/create',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': authToken,
                },
                body: 'realName=' + userName + '&isAdmin=0'
            });
        if (response.ok) {
            document.getElementById('submit_user').style.cursor = '';
            let obj = await response.json();
            let un = obj.username;
            let pw = obj.password;
            alert('User created successfully! Temporary details - \nUsername: '+un+'\nPassword: '+ pw + '\nThis will not be visible again.');
            $('#user_modal').modal('hide');
            document.getElementById('users').click();
            return true;
        } else if (response.status === 403){
            document.getElementById('submit_user').style.cursor = '';
            alert('Your session may have expired - please log in.');
            await loginPrompt();
            $('.modal').modal('hide');
            $('#user_modal').modal('show');
        } else {
            document.getElementById('submit_user').style.cursor = '';
            throw new Error(response.status+' '+response.statusText);
        }
    } catch(error) {
        alert(error);
        return false;
    }
}

async function resetUser(event, userId) {
    event.preventDefault();
    try {
        let authToken = getCookie('authToken');
        let userId = currentUser;
        let response = await fetch('/api/users/reset',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': authToken,
                },
                body: 'userId=' + userId
            });
        if (response.ok) {
            let pw = await response.text();
            alert('Password reset successfully! New temporary password: '+ pw + '. This will not be visible again.');
            $('#user_modal').modal('hide');
            document.getElementById('users').click();
            return true;
        } else if (response.status === 403){
            alert('Your session may have expired - please log in.');
            await loginPrompt();
            $('.modal').modal('hide');
            $('#user_modal').modal('show');
        } else {
            throw new Error(response.status+' '+response.statusText);
        }
    } catch(error) {
        alert(error);
        return false;
    }
}

//OTHER FUNCTIONS

async function userClick(event, topRefresh) { //this is the event that triggers when the users tab is clicked on
    //topRefresh is a bool as to whether to rebuild the top bar or not
    event.preventDefault();
    users = await getUsers();
    if (users) {
        let topHTML = `<div class="form-inline" action="">
                            <button type="button" class="btn btn-outline-dark btn-sm mr-4 ml-3" onclick="newUser()">New User</button>
                            <span class="input-group-text" style="height: 38px;"><i class="fa fa-search"></i></span>
                            <input type="search" class="form-control mr-4" placeholder="Search" id="usr_search">
                            <div class="ml-2 mr-5">
                                <div class="row">
                                    <div class="form-check ml-2">
                                        <label for="usr_names" class="form-check-label">Nicknames:</label>
                                        <input type="checkbox" class="form-check ml-2" id="usr_names" checked>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="form-check ml-2 mr-5">
                                        <label for="usr_tags" class="form-check-label">Usernames:</label>
                                        <input type="checkbox" class="form-check ml-2" id="usr_tags">
                                    </div>
                                </div>
                            </div>
                        </div><br>`;
        let usersHTML = '<div class="list-group">';
        for (var i = 0; i < users.length; i++) {
            usersHTML += users[i].listHTML();
        }
        usersHTML += '</div>';
        if (topRefresh) {
            document.getElementById('top_content').innerHTML = topHTML;
            document.getElementById('usr_search').addEventListener('input', function(event) {
                userClick(event,false); 
            });
        }
        document.getElementById('main_content').innerHTML = usersHTML;
    }
}

function newUser() { //this loads up the box for creating a new user
    document.getElementById('user_edit_title').innerText = 'New User';
    currentUser = -1;
    document.getElementById('user_name').value = '';
    document.getElementById('user_edit_help_text').innerHTML = '<p> When you create a user, a username and temporary password will be generated. These details should be passed to the user so they can sign in. </p> <br>';
    document.getElementById('user_edit_forms').style.display = 'none';
    $('#user_modal').modal('show');
}

function editUser(event,userId) { //this loads up the box for editing a user's details
    event.preventDefault();
    document.getElementById('user_edit_help_text').innerHTML = '';
    document.getElementById('user_edit_forms').style.display = 'block';
    document.getElementById('user_edit_title').innerText = 'Edit user details';
    for (var i = 0; i < users.length; i++) {
        if (users[i].id == userId) {
            document.getElementById('user_name').value = users[i].name;
        }
    }
    currentUser = userId;
    $('#user_modal').modal('show');
    document.getElementById('user_reset').addEventListener('click', resetUser);
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('edit_user').addEventListener('submit', function(event) {
        let sec = document.getElementById('submit_user');
        if (sec.style.cursor == '') {
            sec.style.cursor = 'wait';
            if (currentUser >= 0) {
                updateUser(event);
            } else if (currentUser == -1) {
                addUser(event);
            }
        } else {
            event.preventDefault();
        }
    });
    document.getElementById('users').addEventListener('click', function(event) {
        userClick(event,true); 
    });
});

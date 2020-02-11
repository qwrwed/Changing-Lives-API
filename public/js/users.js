var users;
var currentUser;

var getCookie;
var loginPrompt;

class User {
    constructor(id=0,name='',username='',password='') {
        this.id = id;
        this.name = name;
        this.username = username;
        this.password = password;
    }

    listHTML() {
        return `<li class="list-group-item"><h4 class="user-list-title">${this.name}</h4> : ${this.username}
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
        let response = await fetch('/api/users/list?token='+authToken);
        if (response.ok) {
            let body = await response.text();
            let userData = JSON.parse(body);
            let usrs = [];
            for (var i = 0; i < userData.length; i++) {
                let usr = new User(userData[i].id,userData[i].name,userData[i].username,userData[i].password);
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
        let userName = document.getElementById('user_name').value;
        let userUname = document.getElementById('user_username').value;
        let userPass = document.getElementById('user_password').value;
        let data = new FormData();
        data.append('realName', userName);
        data.append('userName', userUname);
        data.append('userPassword', userPass);
        data.append('userId', currentUser);
        let response = await fetch('/api/users/edit',
            {
                method: 'POST',
                headers: {
                    'Authorization': authToken,
                },
                body: data
            });
        if (response.ok) {
            alert('User details edited successfully!');
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
            let pw = await response.text();
            alert('User created successfully! Temporary password: '+ pw + '. This will not be visible again.');
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

async function userClick(event) { //this is the event that triggers when the users tab is clicked on
    event.preventDefault();
    users = await getUsers();
    if (users) {
        let usersHTML = '<h3>User List</h3> <button type="button" class="btn btn-outline-dark btn-sm" onclick="newUser()">New User</button><br><div class="list-group">';
        for (var i = 0; i < users.length; i++) {
            usersHTML += users[i].listHTML();
        }
        usersHTML += '</div>';
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
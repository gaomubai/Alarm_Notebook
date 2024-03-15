(function(){
    "use strict";

    window.addEventListener('load', function () {
        var status = api.status();
        document.querySelector("#signout_btn").style.display = (status) ? 'block' : 'none';
        api['get_reminder'](function (err, docs) {
            if (err) return onError(err);
            docs.forEach(function (doc) {
                let time = new Date(doc.datetime);
                let elmt = document.createElement("div");
                let text = doc.text;
                if (time < new Date() && doc.repeat == "none") {
                    text = doc.text + " -------------- (FINISHED)";
                }
                elmt.className = "reminder"
                elmt.id = "reminder" + doc._id;
                elmt.innerHTML =`
                    <div class="text">
                        ${text}
                    </div>
                    <div class="time">
                        ${time.toLocaleString()}
                    </div>
                    <div class="repeat">
                        ${doc.repeat}
                    </div>
                    <div class="reminder_del_btn" id="reminder_del_btn">
                        <a href="#" class="btn">
                            Delete
                        </a>
                    </div>
                `;
                elmt.querySelector(".reminder_del_btn").addEventListener('click', function(){
                    api.delete_reminder(doc._id, function(err, msg){
                        if (err) return onError(err);
                    });
                    location.reload();
                });
                document.querySelector("#reminders").prepend(elmt);
            });
        });
    });

    document.querySelector("#add_new_reminder_btn").onclick = function() {
        document.querySelector("#add_new_reminder_window").showModal();
    };

    document.querySelector("#add_new_reminder").onclick = function () {
        var text = document.querySelector("#add_new_reminder_form [name=text]").value;
        var repeat = document.querySelector("#add_new_reminder_form [name=repeat]").value;
        var datetime = document.querySelector("#add_new_reminder_form [name=datetime]").value;
        api['add_new_reminder'](text, repeat, datetime, function(err){
            if (err) {
                alert("Error, double check your input");
                return onError(err);
            }
        });
        location.reload();
    }

    document.querySelector('form').addEventListener('submit', function(e){
        e.preventDefault();
    });
}())
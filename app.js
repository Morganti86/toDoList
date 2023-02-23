const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const _ = require("lodash");
const mongoose = require("mongoose");
mongoose.set('strictQuery', false);

main().catch(err => console.log(err));

async function main() {
    // await mongoose.connect('mongodb://127.0.0.1/todolist_DB');
    await mongoose.connect('mongodb+srv://Morganti86:Morganti86@cluster0.iimainw.mongodb.net/todolist_DB');
    console.log("Connected");
}


const items_Schema = new mongoose.Schema({
    // name: {
    //     type: String,
    //     required: true
    // },
    name: String,
    checked: Boolean
});

const Item = mongoose.model('Item', items_Schema);

const app = express();
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set("view engine", "ejs");

const day = date.getDate();

const listSchema = {
    name: String,
    items: [items_Schema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function (req, res) {
    Item.find(function (err, items) {
        if (err) {
            console.log(err);
        } else {
            res.render("list", { day: day, listTitle: "Today", tasks: items });
        }
    })
});

// selectList
app.get("/:customListName", (req, res) => {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName }, function (err, foundList) {
        if (!err) {
            if (!foundList ) {
                if(customListName != "Selectlist") {
                //create new list
                const list = new List({
                    name: customListName
                    // items: { name: "Have Luck!", checked: false }
                })
                list.save(() => res.redirect('/' + customListName));
                } else {
                    let lists = [];
                    getList().then(datos => {
                    lists = datos;
                    }).then(datos => {
                    res.render("lists", { day: day, lists: lists});
                    })
                }


            } else {
                //show existing list
                res.render("list", { day: day, listTitle: foundList.name, tasks: foundList.items });
            }
        } else {
            console.log(err);
        }
    })
});


app.post("/", function (req, res) {
    const customListName = _.capitalize(req.body.listName);

    if (req.body.task.trim().length != 0) {
        const addItem = req.body.task;
        const item = new Item({
            name: addItem,
            checked: false
        });
        if (customListName === "Today") {
            item.save(() => res.redirect("/"));

        } else {

            List.findOne({ name: customListName }, function (err, foundList) {
                foundList.items.push(item);
                foundList.save(() => res.redirect('/' + customListName));
            })
        }
    } else {
        if (customListName === "Today") {
            res.redirect("/");
        } else {
            res.redirect("/" + customListName);
        }
    }
});

app.post("/remove", function (req, res) {
    const removeItem = req.body.remove;
    const listName = _.capitalize(req.body.listName);

    if (listName === "Today") {
        Item.findByIdAndRemove(removeItem, function (err) {
            if (err) {
                console.log(err);
            } else {
                // console.log("succesful delete");
            }
            res.redirect("/");
        })
    } else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: removeItem } } }, function (err, foundList) {
            if (!err) {
                res.redirect("/" + listName)
            }
        })
    }
});


app.post("/checkbox", function (req, res) {
    const listName = _.capitalize(req.body.listName);
    let updateItem = req.body.checkbox_id;
    let status;

    if (listName === "Today") {

        if (typeof (req.body.checkbox_id) == "object") {
            updateItem = req.body.checkbox_id[0];
        }

        Item.findById(updateItem, function (err, items) {
            if (err) {
                console.log(err);
            }
            else {
                status = items.checked;
            }

            if (status === false) {
                status = true;
            } else {
                status = false;
            }

            Item.findByIdAndUpdate(updateItem, { "checked": status }, function (err) {
                if (!err) {
                    res.redirect("/");
                }
            })
        })
    } else {
        if (typeof (req.body.checkbox_id) == "object") {
            updateItem = req.body.checkbox_id[0];
        }
        List.findOne({ name: listName }, function (err, foundList) {
            if (!err) {
                let array = foundList.items
                array.forEach(function (item) {
                    if (item._id == updateItem) {

                        if (item.checked === false) {
                            item.checked = true;
                        } else {
                            item.checked = false;
                        }

                    }
                })
                List.findOneAndUpdate({ name: listName, "items._id": updateItem }, { $set: { items: array } }, function (errU, foundList) {
                    if (!errU) {
                        res.redirect("/" + listName);
                    }
                });
            } else {
                console.log(err);
            }

        })
    }
});


app.post("/removeAll", function (req, res) {
    const removeItem = req.body.remove;
    const listName = _.capitalize(req.body.listName);

    if (listName === "Today") {
        Item.remove({}, function (err) {
            if (err) {
                console.log(err);
            } else {
                // console.log("succesful delete");
            }
            res.redirect("/");
        })
    } else {
        List.findOneAndRemove({ name: listName }, function (err, foundList) {
            if (!err) {
                res.redirect("/" + listName)
            }
        })
    }
});


app.post("/selectList", function (req, res) {
    let lists = [];
    getList().then(datos => {
        lists = datos;
    }).then(datos => {
        res.render("lists", { day: day, lists: lists});
    })
});

app.post("/listChoosen", function (req, res) {
    let listChoosen = _.capitalize(req.body.listChoosen);
    if (listChoosen === "Today") {
        res.redirect("/");
    } else {
        res.redirect("/" + listChoosen);
    }
});


app.post("/listDelete", function (req, res) {
    let listDelete = req.body.listDelete;
    List.findOneAndDelete({ name: listDelete }, function (err, foundList) {
        if (!err) {
            let lists = [];
            getList().then(datos => {
            lists = datos;
            }).then(datos => {
            res.render("lists", { day: day, lists: lists});
            })
        }
    })
});


app.post("/createList", function (req, res) {
    // const customListName = _.capitalize(req.params.customListName);
    let newList =  _.capitalize(req.body.newList);
    List.findOne({ name: newList }, function (err, foundList) {
        if (!err) {
            if (!foundList) {
                if (newList != "Today") {
                    //create new list
                    const list = new List({
                    name: newList
                    // items: { name: "Have Luck!", checked: false }
                    })
                    list.save(() => res.redirect('/' + newList));
                } else {
                    res.redirect('/');
                }

            } else {
                //show existing list
                res.render("list", { day: day, listTitle: foundList.name, tasks: foundList.items });
            }
        } else {
            console.log(err);
        }
    })
});

app.listen(process.env.PORT || 3000, function () {
    if(process.env.PORT) {
        console.log("Server running on env");
    } else {
        console.log("Server running on port 3000");
    }
});

// functions
function getList() {
    return new Promise((resolve, reject) => {
        let list = ["Today"];
        List.find({}, function (err, foundList) {

            foundList.forEach(function (item) {
                list.push(item.name);
            })        
            resolve(list);
        })
    });
}

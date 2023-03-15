const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const date_valid = require("date-fns/isValid");
const date_format = require("date-fns/format");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const checkQueryParams = (request, response, next) => {
  const { category, priority, status, date } = request.query;
  const categoryArray = ["WORK", "HOME", "LEARNING"];
  const priorityArray = ["LOW", "MEDIUM", "HIGH"];
  const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
  let isOkay = false;
  if (category !== undefined) {
    if (categoryArray.includes(category)) {
      isOkay = true;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }
  if (priority !== undefined) {
    if (priorityArray.includes(priority)) {
      isOkay = true;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  }
  if (status !== undefined) {
    if (statusArray.includes(status)) {
      isOkay = true;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  }

  if (date !== undefined) {
    const is_date_valid = date_valid(date);
    if (is_date_valid) {
      isOkay = true;
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
  if (isOkay) {
    next();
  }
};

const checkRequestBody = (request, response, next) => {
  const { category, priority, status, date } = request.body;
  const categoryArray = ["WORK", "HOME", "LEARNING"];
  const priorityArray = ["LOW", "MEDIUM", "HIGH"];
  const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
  let isOkay = false;
  if (category !== undefined) {
    if (categoryArray.includes(category)) {
      isOkay = true;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }
  if (priority !== undefined) {
    if (priorityArray.includes(priority)) {
      isOkay = true;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  }
  if (status !== undefined) {
    if (statusArray.includes(status)) {
      isOkay = true;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  }

  if (date !== undefined) {
    const is_date_valid = date_valid(date);
    if (is_date_valid) {
      isOkay = true;
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
  if (isOkay) {
    next();
  }
};

//API -1

app.get("/todos/", checkQueryParams, async (request, response) => {
  const {
    category = "",
    priority = "",
    status = "",
    search_q = "",
  } = request.query;
  const getTodoQuery = `select id, todo, priority, status, category, due_date as dueDate from todo where todo like '%${search_q}%'
    and category like '%${category}%'
    and priority like '%${priority}%'
    and status like '%${status}%';`;
  const todoArray = await database.all(getTodoQuery);
  response.send(todoArray);
});

//API-2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `select id, todo, priority, status, category, due_date as dueDate from todo where id = ${todoId};`;
  const getTodo = await database.get(getTodoQuery);
  response.send(getTodo);
});

//API-3
app.get("/agenda/", checkQueryParams, async (request, response) => {
  const { date } = request.query;
  const formatDate = date_format(date, yyyy - MM - dd);
  const getTodoQuery = `select id, todo, priority, status, category, due_date as dueDate
    from todo where due_date = ${formatDate};`;
  const getAgenda = await database.get(getTodoQuery);
  response.send(getAgenda);
});

//API-4
app.post("/todos/", checkRequestBody, async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const postTodoQuery = `
  INSERT INTO
    todo (id, todo, priority, status, category, due_date)
  VALUES
    (${id}, '${todo}', '${priority}', '${status}', '${category}', ${dueDate});`;
  await database.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

//API -5
app.put("/todos/:todoId/", checkRequestBody, async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}',
      category = '${category}',
      due_date = ${dueDate}
    WHERE
      id = ${todoId};`;

  await database.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

//API-6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;

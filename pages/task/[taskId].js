import { useRouter } from "next/router";
import { useAuth } from "../../contexts/AuthContext";
import { useEffect, useState } from "react";
import axios from "axios";
import styles from "../../styles/task/Task.module.css";
import {
  Avatar,
  Button,
  Card,
  CircularProgress,
  FormGroup,
  Modal,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import Box from "../../components/global/Box";
import { Close, Delete, Done, Edit } from "@mui/icons-material";
import withAuth from "../../hoc/withAuth";

const filterTableData = (input, tableData) => {
  const filteredData = tableData.filter((student) => {
    let fullName = `${student.firstName.toLowerCase()} ${student.lastName.toLowerCase()}`;
    return (
      fullName.includes(input.toLowerCase()) ||
      student.firstName.toLowerCase().includes(input.toLowerCase()) ||
      student.lastName.toLowerCase().includes(input.toLowerCase()) ||
      student.username.toLowerCase().includes(input.toLowerCase())
    );
  });
  return filteredData;
};

const Task = () => {
  const { currentUser } = useAuth();
  const isTeacher = currentUser?.role === "teacher";
  const [task, setTask] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { taskId } = router.query;
  const [modalOpen, setModalOpen] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [filter, setFilter] = useState("");
  const [editTask, setEditTask] = useState({
    title: "",
    description: "",
    dueAt: "",
  });
  let filteredTableData = filterTableData(filter, tableData);

  const fetchTask = (id, cb) => {
    if (isTeacher === true) {
      axios
        .get(`/api/classtask/${id}`)
        .then(({ data: { data } }) => {
          setTask(data);
          cb();
        })
        .catch((err) => {
          setError(err.message);
        });
    } else {
      axios
        .get(`/api/task/${id}`)
        .then(({ data: { data } }) => {
          setTask(data);
          cb();
        })
        .catch((err) => {
          setError(err.message);
        });
    }
  };

  useEffect(() => {
    setLoading(true);
    setError("");
    if (currentUser) {
      fetchTask(taskId, () => setLoading(false));
    }
  }, [currentUser, taskId]);

  const formatDate = (date) => {
    const d = new Date(date);
    const dayOfWeek = d.toLocaleString("default", { weekday: "long" });
    const month = d.toLocaleString("default", { month: "long" });
    const day = d.getDate();
    return `${dayOfWeek}, ${month} ${day}`;
  };

  const taskStatus = (date) => {
    const d = new Date(date);
    const today = new Date();
    if (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    ) {
      return { name: "Today", color: "error" };
    } else if (d < today) {
      return { name: "Overdue", color: "error" };
    } else if (d > today) {
      return { name: "Upcoming", color: "primary" };
    }
  };

  const updateTask = (id, data) => {
    if (isTeacher === true) {
      axios
        .put(`/api/classtask/${id}`, data)
        .then(({ data: { data } }) => {
          setTask(data);
        })
        .catch((err) => {
          setError(err.message);
        });
    } else {
      axios
        .put(`/api/task/${id}`, {
          student: currentUser._id,
          ...data,
        })
        .then(({ data: { data } }) => {
          setTask(data);
        })
        .catch((err) => {
          setError(err.message);
        });
    }
  };

  const deleteTask = (id) => {
    if (isTeacher === true) {
      axios
        .delete(`/api/classtask/${id}`)
        .then(() => {
          router.push("/");
        })
        .catch((err) => {
          setError(err.message);
        });
    } else {
      axios
        .delete(`/api/task/${id}`)
        .then(() => {
          router.push("/");
        })
        .catch((err) => {
          setError(err.message);
        });
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setEditTask((prev) => ({ ...prev, [name]: value }));
  };

  const convertDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${year}-${month < 10 ? "0" + month : month}-${
      day < 10 ? "0" + day : day
    }`;
  };

  useEffect(() => {
    if (currentUser) {
      axios
        .get("/api/user", {
          params: {
            role: "student",
          },
        })
        .then(({ data: { data } }) => {
          const formattedData = [];
          data.forEach((student) => {
            formattedData.push({
              id: student._id,
              firstName: student.firstName,
              lastName: student.lastName,
              username: student.username,
              avatar: student.avatar,
            });
          });
          setTableData(formattedData);
        })
        .catch((err) => {
          setError(err.message);
        });
    }
  }, [currentUser]);

  return (
    <div className="container">
      <h1>Task</h1>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Card className={styles.editcard}>
          <div className="title">Edit Task</div>
          <section className="buffer-20"></section>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateTask(taskId, editTask);
              setModalOpen(false);
            }}
          >
            <FormGroup>
              <TextField
                name="title"
                onChange={handleChange}
                label="Title"
                variant="standard"
                required
                value={editTask.title}
              />
              <section className="buffer-20"></section>
              <TextField
                name="description"
                onChange={handleChange}
                label="Description"
                multiline
                rows={5}
                required
                value={editTask.description}
              />
              <section className="buffer-20"></section>
              <TextField
                name="dueAt"
                onChange={handleChange}
                label="Due At"
                type="date"
                InputLabelProps={{ shrink: true }}
                required
                value={editTask.dueAt}
              />
              {error ? (
                <p className="error">{error}</p>
              ) : (
                <section className="buffer-20"></section>
              )}
              <Button variant="contained" color="primary" type="submit">
                Update
              </Button>
            </FormGroup>
          </form>
        </Card>
      </Modal>
      {loading && (
        <div className="loading">
          <CircularProgress />
        </div>
      )}
      {error && <div className="error">{error}</div>}
      {task && (
        <Box title={task.title}>
          <Card className={styles.card}>
            {!isTeacher && (
              <Button
                variant={task.completed ? "outlined" : "contained"}
                startIcon={<Done />}
                onClick={() => {
                  updateTask(task._id, { completed: !task.completed });
                }}
              >
                {task.completed ? "Mark as Undone" : "Mark as Done"}
              </Button>
            )}
            <span className="inlinebuffer-10"></span>
            {(isTeacher || !task.classTask) && (
              <>
                <Button
                  variant="contained"
                  startIcon={<Edit />}
                  onClick={() => {
                    setEditTask({
                      title: task.title,
                      description: task.description,
                      dueAt: convertDate(task.dueAt),
                    });
                    setModalOpen(true);
                  }}
                >
                  Edit
                </Button>
                <span className="inlinebuffer-10"></span>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => {
                    deleteTask(task._id);
                  }}
                >
                  Delete
                </Button>
              </>
            )}
          </Card>
          <section className="buffer-15"></section>
          <Card className={styles.card}>
            <Typography color="text.secondary" component="div">
              Set Date:
            </Typography>
            <Typography className={styles.textbody} component="div">
              {formatDate(task.createdAt)}
            </Typography>
            <section className="buffer-15"></section>
            <Typography color="text.secondary" component="div">
              Due Date:
            </Typography>
            <Typography className={styles.textbody} component="div">
              {formatDate(task.dueAt)}
              <span className="inlinebuffer-10"></span>
              <span className="chip" data-status={taskStatus(task.dueAt).color}>
                {taskStatus(task.dueAt).name}
              </span>
            </Typography>
            <section className="buffer-15"></section>
            <Typography color="text.secondary" component="div">
              Description:
            </Typography>
            <Typography className={styles.textbody} component="div">
              {task.description}
            </Typography>
          </Card>
          <section className="buffer-15"></section>
          {isTeacher && (
            <Card className={styles.card}>
              <Typography color="text.secondary" component="div">
                Finished (
                {
                  task.completeStatus.filter(
                    (student) => student.completed === true
                  ).length
                }
                /{task.completeStatus.length}
                ):
              </Typography>
              <section className="buffer-15"></section>
              <div className={styles.filterinput}>
                <TextField
                  label="Type to Filter..."
                  variant="standard"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>
              <section className="buffer-15"></section>
              {filteredTableData.length ? (
                <Table sx={{ width: "100%" }} size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell className={styles.tablehead}>Name</TableCell>
                      <TableCell className={styles.tablehead} align="right">
                        Finished
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {task.completeStatus.map((student) => {
                      let studentData = filteredTableData.find(
                        (user) => user.id === student.student
                      );
                      if (!studentData) return null;
                      let { firstName, lastName, username, avatar } =
                        studentData;
                      return (
                        <TableRow key={student._id}>
                          <TableCell sx={{ fontSize: "1rem", display: "flex" }}>
                            <Avatar
                              className={styles.avatar}
                              src={avatar || "/static/images/defaultavatar.png"}
                              sx={{ width: 45, height: 45 }}
                            />
                            <span className="inlinebuffer-15"></span>
                            <div className={styles.userdata}>
                              {firstName} {lastName}
                              <Typography
                                color="text.secondary"
                                sx={{ fontSize: "0.8rem" }}
                              >
                                {username}
                              </Typography>
                            </div>
                          </TableCell>
                          <TableCell align="right">
                            {student.completed ? (
                              <Done
                                color="success"
                                style={{ verticalAlign: "middle" }}
                              />
                            ) : (
                              <Close
                                color="error"
                                style={{ verticalAlign: "middle" }}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : loading ? (
                <div className={styles.progress}>
                  <CircularProgress />
                </div>
              ) : (
                <div className={styles.progress}>
                  <Typography>No students</Typography>
                </div>
              )}
            </Card>
          )}
        </Box>
      )}
    </div>
  );
};

export default withAuth(Task);

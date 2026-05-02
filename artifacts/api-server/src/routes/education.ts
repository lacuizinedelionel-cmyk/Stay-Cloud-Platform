import { Router, type IRouter } from "express";
import { eq, and, ilike } from "drizzle-orm";
import { db, coursesTable, studentsTable, enrollmentsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/education/courses", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  const courses = await db.select().from(coursesTable).where(eq(coursesTable.businessId, businessId));
  res.json(courses.map(c => ({ ...c, price: parseFloat(c.price), createdAt: c.createdAt.toISOString() })));
});

router.post("/education/courses", async (req, res): Promise<void> => {
  const { businessId, name, description, durationMonths, price, availableSpots, startDate } = req.body;
  if (!businessId || !name || !durationMonths || !price || !availableSpots || !startDate) { res.status(400).json({ error: "Missing required fields" }); return; }
  const [course] = await db.insert(coursesTable).values({ businessId, name, description, durationMonths, price: price.toString(), availableSpots, startDate }).returning();
  res.status(201).json({ ...course, price: parseFloat(course.price), createdAt: course.createdAt.toISOString() });
});

router.get("/education/students", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  const conditions = [eq(studentsTable.businessId, businessId)];
  if (req.query.search) conditions.push(ilike(studentsTable.name, `%${req.query.search}%`));
  const students = await db.select().from(studentsTable).where(and(...conditions));
  res.json(students.map(s => ({ ...s, attendanceRate: parseFloat(s.attendanceRate ?? "0"), createdAt: s.createdAt.toISOString() })));
});

router.post("/education/students", async (req, res): Promise<void> => {
  const { businessId, name, phone, email, city } = req.body;
  if (!businessId || !name) { res.status(400).json({ error: "Missing required fields" }); return; }
  const [student] = await db.insert(studentsTable).values({ businessId, name, phone, email, city }).returning();
  res.status(201).json({ ...student, attendanceRate: 0, createdAt: student.createdAt.toISOString() });
});

router.get("/education/enrollments", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  const conditions = [eq(enrollmentsTable.businessId, businessId)];
  if (req.query.courseId) conditions.push(eq(enrollmentsTable.courseId, parseInt(req.query.courseId as string, 10)));
  const enrollments = await db.select().from(enrollmentsTable).where(and(...conditions));
  res.json(enrollments.map(e => ({ ...e, totalAmount: parseFloat(e.totalAmount), amountPaid: parseFloat(e.amountPaid), createdAt: e.createdAt.toISOString() })));
});

router.post("/education/enrollments", async (req, res): Promise<void> => {
  const { businessId, studentId, courseId, totalAmount, amountPaid, installments } = req.body;
  if (!businessId || !studentId || !courseId || !totalAmount) { res.status(400).json({ error: "Missing required fields" }); return; }
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, studentId));
  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId));
  if (!student || !course) { res.status(404).json({ error: "Student or course not found" }); return; }
  const paid = amountPaid ?? 0;
  const status = paid >= totalAmount ? "PAID" : paid > 0 ? "PARTIAL" : "PENDING";
  const today = new Date().toISOString().split("T")[0];
  const [enrollment] = await db.insert(enrollmentsTable).values({
    businessId, studentId, studentName: student.name, courseId, courseName: course.name,
    enrollmentDate: today, totalAmount: totalAmount.toString(), amountPaid: paid.toString(),
    installments: installments ?? 1, paymentStatus: status
  }).returning();
  // Update student with course info
  await db.update(studentsTable).set({ courseId, courseName: course.name, enrollmentDate: today, paymentStatus: status })
    .where(eq(studentsTable.id, studentId));
  res.status(201).json({ ...enrollment, totalAmount: parseFloat(enrollment.totalAmount), amountPaid: parseFloat(enrollment.amountPaid), createdAt: enrollment.createdAt.toISOString() });
});

router.get("/education/stats", async (req, res): Promise<void> => {
  const businessId = parseInt(req.query.businessId as string, 10);
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  const students = await db.select().from(studentsTable).where(eq(studentsTable.businessId, businessId));
  const courses = await db.select().from(coursesTable).where(and(eq(coursesTable.businessId, businessId), eq(coursesTable.isActive, true)));
  const enrollments = await db.select().from(enrollmentsTable).where(eq(enrollmentsTable.businessId, businessId));
  const pending = enrollments.filter(e => e.paymentStatus === "PENDING" || e.paymentStatus === "OVERDUE").length;
  const avgAttendance = students.length ? students.reduce((s, st) => s + parseFloat(st.attendanceRate ?? "0"), 0) / students.length : 0;
  const monthlyRevenue = enrollments.reduce((s, e) => s + parseFloat(e.amountPaid), 0);
  res.json({ totalStudents: students.length, activeCourses: courses.length, pendingPayments: pending, attendanceRate: avgAttendance, monthlyRevenue });
});

export default router;

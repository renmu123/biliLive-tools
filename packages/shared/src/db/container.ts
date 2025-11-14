import { createContainer, asClass, asFunction, asValue, InjectionMode } from "awilix";

import StatisticsModel from "./model/statistics.js";

import StatisticsService from "./service/statisticsService.js";

import type { Database } from "better-sqlite3";

// import { createDatabase } from "./database";

// // Repositories
// import { SchoolRepository } from "../repositories/SchoolRepository";
// import { GradeRepository } from "../repositories/GradeRepository";
// import { ClassRepository } from "../repositories/ClassRepository";
// import { TeacherRepository } from "../repositories/TeacherRepository";
// import { StudentRepository } from "../repositories/StudentRepository";
// import { CourseRepository } from "../repositories/CourseRepository";
// import { EnrollmentRepository } from "../repositories/EnrollmentRepository";

// // Services
// import { SchoolService } from "../services/SchoolService";
// import { GradeService } from "../services/GradeService";
// import { ClassService } from "../services/ClassService";
// import { TeacherService } from "../services/TeacherService";
// import { StudentService } from "../services/StudentService";
// import { CourseService } from "../services/CourseService";
// import { EnrollmentService } from "../services/EnrollmentService";

export interface Container {
  db: Database;
  statisticsModel: StatisticsModel;
  statisticsService: StatisticsService;
  //   schoolRepository: SchoolRepository;
  //   gradeRepository: GradeRepository;
  //   classRepository: ClassRepository;
  //   teacherRepository: TeacherRepository;
  //   studentRepository: StudentRepository;
  //   courseRepository: CourseRepository;
  //   enrollmentRepository: EnrollmentRepository;
  //   schoolService: SchoolService;
  //   gradeService: GradeService;
  //   classService: ClassService;
  //   teacherService: TeacherService;
  //   studentService: StudentService;
  //   courseService: CourseService;
  //   enrollmentService: EnrollmentService;
}

export function setupContainer(db: Database) {
  const container = createContainer<Container>({
    injectionMode: InjectionMode.PROXY,
  });

  // Register database instance
  container.register({
    db: asValue(db),
  });

  // Register all Repositories
  container.register({
    statisticsModel: asClass(StatisticsModel).singleton(),
  });

  // Register all Services
  container.register({
    statisticsService: asClass(StatisticsService).singleton(),
  });

  return container;
}

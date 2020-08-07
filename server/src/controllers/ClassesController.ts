import { Request, Response } from 'express';

import db from '../database/connection';
import convertHourToMinutes from '../utils/convertHourToMinutes';

interface ScheduleItem {
  class_id: number;
  week_day: number;
  from: string;
  to: string;
}

export default class ClassesController {
  async index(request: Request, response: Response) {}

  async create(request: Request, response: Response) {
    const {
      name,
      avatar,
      whatsapp,
      bio,
      subject,
      cost,
      schedule,
    } = request.body;

    const trx = await db.transaction();

    try {
      const insertedUsersIds = await trx('users').insert({
        name,
        avatar,
        whatsapp,
        bio,
      });

      const user_id = insertedUsersIds[0];

      const insertedClassesIds = await trx('classes').insert({
        subject,
        cost,
        user_id,
      });

      const class_id = insertedClassesIds[0];

      const classSchedule = schedule.map(
        (scheduleItem: Omit<ScheduleItem, 'class_id'>): ScheduleItem => {
          return {
            class_id,
            week_day: scheduleItem.week_day,
            from: convertHourToMinutes(scheduleItem.from),
            to: convertHourToMinutes(scheduleItem.to),
          };
        },
      );

      await trx('class_schedule').insert(classSchedule);

      await trx.commit();

      return response.status(201).json({ message: 'ok' });
    } catch (err) {
      await trx.rollback();

      console.log(err);
      return response.status(400).json({
        error: 'Unexpected error while creating a new class',
      });
    }
  }
}

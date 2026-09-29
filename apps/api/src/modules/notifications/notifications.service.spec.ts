import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventBusService } from '../../common/events/event-bus.service';
import { User } from '../users/entities/user.entity';
import { NotificationLog } from './entities/notification-log.entity';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let logsRepo: { create: jest.Mock; save: jest.Mock; find: jest.Mock };
  let usersRepo: { count: jest.Mock };
  let eventBus: { publish: jest.Mock };

  beforeEach(async () => {
    logsRepo = {
      create: jest.fn().mockImplementation((val: Record<string, unknown>) => ({
        id: 'log-1',
        createdAt: new Date(),
        ...val,
      })),
      save: jest
        .fn()
        .mockImplementation((val: Record<string, unknown>) =>
          Promise.resolve({ id: 'log-1', createdAt: new Date(), ...val }),
        ),
      find: jest.fn().mockResolvedValue([
        {
          id: 'log-1',
          title: 'Majlis',
          message: 'Darslar haqida',
          type: 'ANNOUNCEMENT',
          target: 'ALL_PARENTS',
          channel: 'TELEGRAM',
          recipientCount: 15,
          createdAt: new Date(),
        },
      ]),
    };

    usersRepo = {
      count: jest.fn().mockResolvedValue(15),
    };

    eventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(NotificationLog), useValue: logsRepo },
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: EventBusService, useValue: eventBus },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send broadcast and publish event', async () => {
    const result = await service.sendBroadcast(
      {
        title: 'Diqqat',
        message: 'Ertaga shanbalik',
        target: 'ALL_PARENTS',
      },
      { id: 'user-1', fullName: 'Admin' },
    );

    expect(usersRepo.count).toHaveBeenCalled();
    expect(eventBus.publish).toHaveBeenCalledWith(
      'broadcast.announcement',
      expect.objectContaining({
        title: 'Diqqat',
        message: 'Ertaga shanbalik',
        target: 'ALL_PARENTS',
      }),
    );
    expect(logsRepo.save).toHaveBeenCalled();
    expect(result.title).toBe('Diqqat');
  });

  it('should return notification history logs', async () => {
    const logs = await service.getLogs(10);
    expect(logsRepo.find).toHaveBeenCalled();
    expect(logs.length).toBe(1);
    expect(logs[0].title).toBe('Majlis');
  });
});

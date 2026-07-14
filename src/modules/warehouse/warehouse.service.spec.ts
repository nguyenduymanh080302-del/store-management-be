import { NotFoundException } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';

describe('WarehouseService', () => {
    it('throws NotFoundException when warehouse does not exist', async () => {
        const prisma = {
            warehouse: {
                findUnique: jest.fn().mockResolvedValue(null),
            },
        } as any;

        const service = new WarehouseService(prisma);

        await expect(service.findWarehouseById(999)).rejects.toThrow(NotFoundException);
    });
});

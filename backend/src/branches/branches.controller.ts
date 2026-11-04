import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../common/admin.guard';
import { AuthGuard } from '../common/auth.guard';
import { BranchesService } from './branches.service';

@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  list() {
    return this.branchesService.list(false);
  }

  @Get('all')
  @UseGuards(AuthGuard, AdminGuard)
  listAll() {
    return this.branchesService.list(true);
  }

  @Post()
  @UseGuards(AuthGuard, AdminGuard)
  create(@Body() body: { name: string }) {
    return this.branchesService.create(body.name);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, AdminGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() body: { name?: string; isActive?: boolean }) {
    return this.branchesService.update(id, body);
  }
}

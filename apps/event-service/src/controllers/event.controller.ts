import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EventService } from '../services/event.service';
import { CreateEventDto, KafkaTopics } from '@app/common';

@Controller()
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @MessagePattern(KafkaTopics.EVENT_CREATE)
  async createEvent(@Payload() createEventDto: CreateEventDto) {
    return this.eventService.createEvent(createEventDto);
  }

  @MessagePattern(KafkaTopics.EVENT_FIND_ALL)
  async findAllEvents() {
    return this.eventService.findAll();
  }

  @MessagePattern(KafkaTopics.EVENT_FIND_ONE)
  async findOneEvent(@Payload() data: { id: string }) {
    return this.eventService.findOne(data.id);
  }

  @MessagePattern(KafkaTopics.EVENT_UPDATE)
  async updateEvent(@Payload() data: { id: string; updateData: any }) {
    return this.eventService.updateEvent(data.id, data.updateData);
  }
} 
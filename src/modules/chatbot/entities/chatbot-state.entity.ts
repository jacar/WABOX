import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('chatbot_states')
export class ChatbotState {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  chatId: string;

  @Column({ type: 'varchar', length: 50, default: 'START' })
  state: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sessionName: string;

  @Column({ type: 'text', default: '{}' })
  metadata: string; // Guardado como JSON string (platos, dirección, etc.)

  @UpdateDateColumn()
  updatedAt: Date;
}

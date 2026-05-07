import torch
import torch.nn as nn

class BehaviorLSTM(nn.Module):
    def __init__(self, num_prods, num_acts, embed_dim=128, hidden_dim=256, n_layers=2, dropout=0.38670506350007827):
        super().__init__()
        self.prod_emb = nn.Embedding(num_prods, embed_dim)
        self.act_emb = nn.Embedding(num_acts, embed_dim)
        self.lstm = nn.LSTM(embed_dim * 2, hidden_dim, n_layers, batch_first=True, dropout=dropout)
        self.fc = nn.Linear(hidden_dim, num_prods)

    def forward(self, prod_seq, act_seq):
        prod_e = self.prod_emb(prod_seq)
        act_e = self.act_emb(act_seq)
        x = torch.cat([prod_e, act_e], dim=-1)
        out, _ = self.lstm(x)
        out = out[:, -1, :]
        logits = self.fc(out)
        return logits

#!/usr/bin/env bash
iptables -S INPUT | awk '{if ($0 ~ /CSGOSERVERPICKER/){print (NR-1)}}' > iptables_ruleids.list
RIDS=($(cat iptables_ruleids.list | sort -nr))
for RID in "${RIDS[@]}"
do
  iptables -D INPUT $RID
done
rm iptables_ruleids.list

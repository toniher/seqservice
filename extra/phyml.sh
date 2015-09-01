TEMPFILE=`mktemp`

cat > $TEMPFILE
phyml -i $TEMPFILE

OUTPUT=$TEMPFILE"_phyml_tree.txt"

cat $OUTPUT

rm $OUTPUT
rm $TEMPFILE
